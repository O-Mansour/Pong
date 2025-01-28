import json
import time
import math
import jwt
import random
import asyncio
import uuid
from core.models import Profile
from core.models import Match
from enum import Enum, auto
from typing import Dict, List, Optional
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
import sys
from threading import Thread
from datetime import datetime
from django.utils import timezone
from urllib.parse import urlparse, parse_qs
from django.conf import settings
from django.contrib.auth import get_user_model

class PlayerSide(Enum):
    LEFT = 'left'
    RIGHT = 'right'
class GameConfig:
    FPS = 120
    FRAME_TIME = 1 / FPS
    BALL_SPEED = 0.4
    PADDLE_SPEED = 0.1
    PADDLE_BOUND = 2.4
    BALL_BOUND_Z = 2.9
    PADDLE_HITBOX_HEIGHT = 1.2
    PADDLE_HITBOX_WIDTH = 0.2
    BALL_RADIUS = 0.1 
    PADDLE_X_POSITIONS = {
        PlayerSide.LEFT: -4.9,
        PlayerSide.RIGHT: 4.9
    }

class PongGameLocalConsumer(AsyncWebsocketConsumer):
    game_rooms = {}
    async def connect(self):
        await self.accept()
        self.room_id = str(uuid.uuid4())
        self.game_rooms[self.room_id] = {
            'players': {},
            'game_state': self._create_initial_game_state()
        }
        player_side = self._assign_player_side()
        await self.send(text_data=json.dumps({
            'type': 'players_ready',
            'player_side': player_side,
            'room_id': self.room_id
        }))
    def _assign_player_side(self):
        if not self.game_rooms[self.room_id]['players'].get(PlayerSide.LEFT.value):
            self.game_rooms[self.room_id]['players'][PlayerSide.LEFT.value] = self.channel_name
            return PlayerSide.LEFT.value
        elif not self.game_rooms[self.room_id]['players'].get(PlayerSide.RIGHT.value):
            self.game_rooms[self.room_id]['players'][PlayerSide.RIGHT.value] = self.channel_name
            return PlayerSide.RIGHT.value
        else:
            raise ValueError('Game room is full')
    async def disconnect(self, close_code):
        if hasattr(self, 'room_id') and self.room_id in self.game_rooms:
            game_state = self.game_rooms[self.room_id]['game_state']
            game_state['playing'] = False
            del self.game_rooms[self.room_id]
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if 'room_id' in data:
                self.room_id = data['room_id']
            if data['type'] == 'go_back':
                await self.match_canceled()
            if data['type'] == 'paddle_move':
                await self._handle_paddle_move(data)
            elif data['type'] == 'start_game':
                await self._handle_start_game()
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Unexpected error: {str(e)}'
            }))
    async def match_canceled(self):
        await self.send(text_data=json.dumps({
            'type': 'match_canceled',
            'message': 'Game Over'
        }))
    async def _handle_paddle_move(self, data: Dict):
        game_state = self.game_rooms[self.room_id]['game_state']
        current_position = game_state['paddles'][data['player']]['position']
        new_position = self._calculate_new_paddle_position(
            current_position, 
            data['direction']
        )
        game_state['paddles'][data['player']]['position'] = new_position
        await self._update_clients()
    async def _handle_start_game(self):
        game_state = self.game_rooms[self.room_id]['game_state']
        if len(self.game_rooms[self.room_id]['players']) >= 1 and not game_state['playing']:
            game_state['playing'] = True
            asyncio.create_task(self._game_loop())
    async def _game_loop(self):
        last_frame_time = time.perf_counter()
        while True:
            if self.room_id not in self.game_rooms:
                break
            game_state = self.game_rooms[self.room_id]['game_state']
            if not game_state['playing']:
                break
            current_time = time.perf_counter()
            delta_time = current_time - last_frame_time
            if delta_time >= GameConfig.FRAME_TIME:
                last_frame_time = current_time
                self._update_game_state(delta_time)
                await self._update_clients()
            await asyncio.sleep(0.001)
    def _create_initial_game_state(self) -> Dict:
        return {
            'ball': {
                'position': [0, 0.1, 0],
                'velocity': self._generate_initial_velocity(),
            },
            'paddles': {
                PlayerSide.LEFT.value: {'position': 0},
                PlayerSide.RIGHT.value: {'position': 0},
            },
            'scores': {PlayerSide.LEFT.value: 0, PlayerSide.RIGHT.value: 0},
            'playing': False,
        }
    def _generate_initial_velocity(self) -> List[float]:
        angle = random.uniform(-math.pi / 8, math.pi / 8)
        direction = random.choice([-1, 1])
        return [
            direction * GameConfig.BALL_SPEED,
            0,
            direction * GameConfig.BALL_SPEED * math.sin(angle),
        ]
    def _calculate_new_paddle_position(self, current_position: float, direction: str) -> float:
        if direction == 'up' and current_position > -GameConfig.PADDLE_BOUND:
            return current_position - GameConfig.PADDLE_SPEED
        elif direction == 'down' and current_position < GameConfig.PADDLE_BOUND:
            return current_position + GameConfig.PADDLE_SPEED
        return current_position
    def _update_game_state(self, delta_time: float):
        if self.room_id not in self.game_rooms:
            return
        game_state = self.game_rooms[self.room_id]['game_state']
        ball = game_state['ball']
        paddles = game_state['paddles']
        scores = game_state['scores']
        next_x = ball['position'][0] + ball['velocity'][0] * delta_time * 15
        next_z = ball['position'][2] + ball['velocity'][2] * delta_time * 15
        next_z = self._handle_z_boundary_collision(ball, next_z)
        ball['position'][0] = next_x
        ball['position'][2] = next_z
        self._check_paddle_and_goal_collisions(game_state)
    def _handle_z_boundary_collision(self, ball: Dict, next_z: float) :
        if next_z >= GameConfig.BALL_BOUND_Z:
            next_z = GameConfig.BALL_BOUND_Z - (next_z - GameConfig.BALL_BOUND_Z)
            ball['velocity'][2] *= -1
        elif next_z <= -GameConfig.BALL_BOUND_Z:
            next_z = -GameConfig.BALL_BOUND_Z + (-next_z - GameConfig.BALL_BOUND_Z)
            ball['velocity'][2] *= -1
        return next_z
    def _check_paddle_and_goal_collisions(self, game_state: Dict):
        ball = game_state['ball']
        paddles = game_state['paddles']
        scores = game_state['scores']
        for side in [PlayerSide.LEFT.value, PlayerSide.RIGHT.value]:
            paddle_x = -4.9 if side == PlayerSide.LEFT.value else 4.9
            if self._check_paddle_collision(ball, paddle_x, paddles[side]):
                continue
            if (side == PlayerSide.LEFT.value and ball['position'][0] < -5) or \
            (side == PlayerSide.RIGHT.value and ball['position'][0] > 5):
                scoring_side = PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value
                scores[scoring_side] += 1
                asyncio.create_task(self._send_score_update(scores))
                if scores[scoring_side] >= 3:
                    asyncio.create_task(self.match_finished())
                    self._stop_ball(game_state)
                    break
                self._reset_ball(game_state)
    async def _send_score_update(self, scores: Dict):
        await self.send(text_data=json.dumps({
            'type': 'score_update',
            'scores': {
                'left': scores[PlayerSide.LEFT.value],
                'right': scores[PlayerSide.RIGHT.value]
            },
            'room_id': self.room_id
        }))
    async def match_finished(self):
        await self.send(text_data=json.dumps({
            'type': 'match_finished',
            'message': 'Game Over'
        }))
    def _check_paddle_collision(self, ball: Dict, paddle_x: float, paddle: Dict) -> bool:
        if (paddle_x > 0 and ball['position'][0] >= paddle_x - GameConfig.BALL_RADIUS) or \
        (paddle_x < 0 and ball['position'][0] <= paddle_x + GameConfig.BALL_RADIUS):
            paddle_pos = paddle['position']
            z_distance = abs(ball['position'][2] - paddle_pos)
            if z_distance <= 0.6:
                relative_hit_pos = (ball['position'][2] - paddle_pos) / 0.6
                angle = relative_hit_pos * (math.pi / 4)
                ball['velocity'][0] *= -1
                ball['velocity'][2] = GameConfig.BALL_SPEED * math.sin(angle)
                ball['position'][0] = paddle_x + (GameConfig.BALL_RADIUS * (1 if paddle_x < 0 else -1))
                return True
        return False
    def _stop_ball(self, game_state: Dict):
        game_state['ball']['position'] = [0, 0.1, 0]
        game_state['ball']['velocity'] = [0, 0, 0]
    def _reset_ball(self, game_state: Dict):
        game_state['ball']['position'] = [0, 0.1, 0]
        game_state['ball']['velocity'] = self._generate_initial_velocity()
    async def _update_clients(self):
        if self.room_id in self.game_rooms:
            await self.send(text_data=json.dumps({
                'type': 'game_state',
                'game_state': self.game_rooms[self.room_id]['game_state'],
                'room_id': self.room_id
            }))

class PongGameRemoteConsumer(AsyncWebsocketConsumer):
    game_rooms: Dict[str, Dict] = {}
    async def connect(self):
        query_string = self.scope['query_string'].decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        if not token:
            await self.close(code=403)
            return
        try:
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            self.user_id = decoded_token.get('user_id')
            if not self.user_id:
                await self.close(code=403)
                return
            self.user = await self.get_user(self.user_id)
            if not self.user:
                await self.close(code=403)
                return
            await self.accept()
            if self.user_id in self.game_rooms:
                await self.send(text_data=json.dumps({
                    'type': 'already',
                    'message': 'You are already in a game!'
                }))
                await self.close(code=403)
                return
            room = await self.find_or_create_game_room()
            await self.channel_layer.group_add(room['room_group_name'], self.channel_name)
            self.room_name = room['room_name']
            self.room_group_name = room['room_group_name']
            self.player_side = self._assign_player_side(room)
            if not room['game_state']:
                room['game_state'] = self._create_initial_game_state()
            if 'player_info' not in room:
                room['player_info'] = {}
            room['player_info'][self.player_side] = {
                'username': self.user.username,
                'img' : await self._get_player_image(),
                'channel_name': self.channel_name
            }
            self.game_rooms[self.user_id] = self.room_name
            await self._notify_players_ready(room)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_game_message',
                    'message': {
                        'type': 'player_info',
                        'player_info': room['player_info']
                    }
                }
            )
        except (jwt.ExpiredSignatureError, jwt.DecodeError):
            await self.close(code=403)
            return
    async def disconnect(self, close_code):
        if not hasattr(self, 'room_name'):
            return
        room = self.game_rooms.get(self.room_name)
        if not room:
            return
        had_both_players = len(room['players']) == 2
        if self.player_side in room['players']:
            del room['players'][self.player_side]
        if 'player_info' in room and self.player_side in room['player_info']:
            if self.user_id in self.game_rooms:
                del self.game_rooms[self.user_id]
            del room['player_info'][self.player_side]
        if had_both_players:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_game_message',
                    'message': {
                        'type': 'match_canceled',
                        'message': 'Opponent disconnected'
                    }
                }
            )
            if room.get('game_state', {}).get('playing', False):
                room['game_state']['playing'] = False
        if not room['players']:
            if self.room_name in self.game_rooms:
                del self.game_rooms[self.room_name]
        await self.channel_layer.group_discard(
            self.room_group_name, 
            self.channel_name
        )
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            room = self.game_rooms.get(self.room_name)
            if not room:
                return
            if data['type'] == 'go_back':
                await self.match_canceled()
            if data['type'] == 'paddle_move':
                await self._handle_paddle_move(data, room)
            elif data['type'] == 'start_game':
                await self._handle_start_game(room)
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Unexpected error: {str(e)}'
            }))
    async def match_canceled(self):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_game_message',
                    'message': {
                        'type': 'match_canceled',
                        'message': 'Game Over'
                    },
                },
            )
    async def get_user(self, user_id):
        from django.contrib.auth import get_user_model
        try:
            return await database_sync_to_async(get_user_model().objects.select_related('profile').get)(id=user_id)
        except get_user_model().DoesNotExist:
            return None
    def _assign_player_side(self, room: Dict) -> str:
        if not room['players'].get(PlayerSide.LEFT.value):
            room['players'][PlayerSide.LEFT.value] = self.channel_name
            return PlayerSide.LEFT.value
        elif not room['players'].get(PlayerSide.RIGHT.value):
            room['players'][PlayerSide.RIGHT.value] = self.channel_name
            return PlayerSide.RIGHT.value
        else:
            raise ValueError('Game room is full')
    def _create_initial_game_state(self) -> Dict:
        return {
            'ball': {
                'position': [0, 0.1, 0],
                'velocity': self._generate_initial_velocity(),
            },
            'paddles': {
                PlayerSide.LEFT.value: {'position': 0},
                PlayerSide.RIGHT.value: {'position': 0},
            },
            'scores': {PlayerSide.LEFT.value: 0, PlayerSide.RIGHT.value: 0},
            'playing': False,
        }
    async def _notify_players_ready(self, room: Dict):
        players_info = {}
        if 'player_info' in room:
            for side, info in room['player_info'].items():
                players_info[side] = {
                    'username': info['username'],
                    'img': info['img']
                }
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_game_message',
                'message': {
                    'type': 'players_ready',
                    'players_count': len(room['players']),
                    'player_side': self.player_side,
                    'player_username': self.user.username,
                    'players': players_info,
                    'waiting': len(room['players']) == 1
                }
            }
        )
    @database_sync_to_async
    def _get_player_image(self):
        print(f"username-> '{self.user.username}'", file=sys.stderr)
        image = Profile.objects.get(user__username=self.user.username).profileimg
        print(f"image-> '{image}'", file=sys.stderr)
        return str(image)
    def _generate_initial_velocity(self) -> List[float]:
        angle = random.uniform(-math.pi / 8, math.pi / 8)
        direction = random.choice([-1, 1])
        return [
            direction * GameConfig.BALL_SPEED,
            0,  
            direction * GameConfig.BALL_SPEED * math.sin(angle),
        ]
    async def _handle_paddle_move(self, data: Dict, room: Dict):
        if data['player'] != self.player_side:
            return
        if not room.get('game_state'):
            room['game_state'] = self._create_initial_game_state()
        self._ensure_both_paddles(room)
        current_position = room['game_state']['paddles'][data['player']]['position']
        new_position = self._calculate_new_paddle_position(
            current_position, 
            data['direction']
        )
        room['game_state']['paddles'][data['player']]['position'] = new_position
        await self._update_clients(room)
    def _calculate_new_paddle_position(self, current_position: float, direction: str) -> float:
        if direction == 'up' and current_position > -GameConfig.PADDLE_BOUND:
            return current_position - GameConfig.PADDLE_SPEED
        elif direction == 'down' and current_position < GameConfig.PADDLE_BOUND:
            return current_position + GameConfig.PADDLE_SPEED
        return current_position
    def _ensure_both_paddles(self, room: Dict):
        if len(room['players']) == 1:
            existing_side = list(room['players'].keys())[0]
            missing_side = PlayerSide.RIGHT.value if existing_side == PlayerSide.LEFT.value else PlayerSide.LEFT.value
            room['game_state']['paddles'][missing_side] = {'position': 0}
    async def _handle_start_game(self, room: Dict):
        if len(room['players']) == 2 and not room['game_state']['playing']:
            room['game_state']['playing'] = True
            asyncio.create_task(self._game_loop(room))
        elif len(room['players']) == 1:
            pass
    async def _game_loop(self, room: Dict):
        last_frame_time = time.perf_counter()
        while room['game_state']['playing']:
            current_time = time.perf_counter()
            delta_time = current_time - last_frame_time
            if delta_time >= GameConfig.FRAME_TIME:
                last_frame_time = current_time
                self._update_game_state(room, delta_time)
                await self._update_clients(room)
            await asyncio.sleep(0.001)
    def _update_game_state(self, room: Dict, delta_time: float):
        game_state = room['game_state']
        ball = game_state['ball']
        paddles = game_state['paddles']
        scores = game_state['scores']
        next_x = ball['position'][0] + ball['velocity'][0] * delta_time * 15
        next_z = ball['position'][2] + ball['velocity'][2] * delta_time * 15
        next_z = self._handle_z_boundary_collision(ball, next_z)
        ball['position'][0] = next_x
        ball['position'][2] = next_z
        self._check_paddle_and_goal_collisions(game_state)
    def _handle_z_boundary_collision(self, ball: Dict, next_z: float) -> float:
        if next_z >= GameConfig.BALL_BOUND_Z:
            next_z = GameConfig.BALL_BOUND_Z - (next_z - GameConfig.BALL_BOUND_Z)
            ball['velocity'][2] *= -1
        elif next_z <= -GameConfig.BALL_BOUND_Z:
            next_z = -GameConfig.BALL_BOUND_Z + (-next_z - GameConfig.BALL_BOUND_Z)
            ball['velocity'][2] *= -1
        return next_z
    async def _send_score_update(self, scores: Dict):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_game_message',
                'message': {
                    'type': 'score_update',
                    'scores': {
                        'left': scores[PlayerSide.LEFT.value],
                        'right': scores[PlayerSide.RIGHT.value]
                    }
                }
            }
        )
    def _check_paddle_and_goal_collisions(self, game_state: Dict):
        ball = game_state['ball']
        paddles = game_state['paddles']
        scores = game_state['scores']
        room = self.game_rooms.get(self.room_name)
        for side in [PlayerSide.LEFT.value, PlayerSide.RIGHT.value]:
            paddle_x = GameConfig.PADDLE_X_POSITIONS[PlayerSide(side)]
            if self._check_paddle_collision(ball, paddle_x, paddles[side]):
                continue
            if (side == PlayerSide.LEFT.value and ball['position'][0] < -5) or \
            (side == PlayerSide.RIGHT.value and ball['position'][0] > 5):
                scoring_side = PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value
                scores[scoring_side] += 1
                asyncio.create_task(self._send_score_update(scores))
                if scores[scoring_side] >= 3:
                    winning_side = scoring_side
                    losing_side = PlayerSide.RIGHT.value if winning_side == PlayerSide.LEFT.value else PlayerSide.LEFT.value
                    if 'player_info' in room:
                        winner_info = room['player_info'].get(winning_side)
                        loser_info = room['player_info'].get(losing_side)
                        if winner_info and loser_info:
                            winner_username = winner_info['username']
                            loser_username = loser_info['username']
                            Thread(target=self._update_player_stats, args=(winner_username, loser_username, True)).start()
                            Thread(target=self._update_player_stats, args=(winner_username, loser_username, False)).start()
                    self._stop_ball(game_state)
                    game_state['playing'] = False
                    asyncio.create_task(self.match_finished(winner_info['username']))
                else:
                    self._reset_ball(game_state)
    async def match_finished(self, winner):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_game_message',
                    'message': {
                        'type': 'match_finished',
                        'message': 'Game Over',
                        'winner' : winner,
                    },
                },
            )
    def _update_player_stats(self, winner_username: str, loser_username: str, is_winner: bool):
            from django.db import connection
            from django.contrib.auth import get_user_model
            from django.db.models import Q
            connection.close()
            User = get_user_model()
            winner = User.objects.get(username=winner_username)
            loser = User.objects.get(username=loser_username)
            if is_winner:
                winner.profile.wins += 1
                if winner.profile.xps < 80:
                    winner.profile.xps += 20
                else:
                    winner.profile.level += 1
                    winner.profile.xps = 80 - winner.profile.xps
                profiles_with_better_level = Profile.objects.filter(
                    Q(level__gt=winner.profile.level) |
                    Q(level=winner.profile.level, xps__gt=winner.profile.xps)
                ).count()
                winner.profile.rank = profiles_with_better_level + 1
                Match.objects.create(
                    player=winner.profile,
                    opponent=loser.profile,
                    won=True,
                    date_played=timezone.now()
                )
                winner.profile.save()
            else:
                loser.profile.losses += 1
                Match.objects.create(
                    player=loser.profile,
                    opponent=winner.profile,
                    won=False,
                    date_played=timezone.now()
                )
                loser.profile.save()
    def _check_paddle_collision(self, ball: Dict, paddle_x: float, paddle: Dict) -> bool:
        if (paddle_x > 0 and ball['position'][0] >= paddle_x - GameConfig.BALL_RADIUS) or \
           (paddle_x < 0 and ball['position'][0] <= paddle_x + GameConfig.BALL_RADIUS):
            paddle_pos = paddle['position']
            z_distance = abs(ball['position'][2] - paddle_pos)
            if z_distance <= (GameConfig.PADDLE_HITBOX_HEIGHT / 2 + GameConfig.BALL_RADIUS):
                relative_hit_pos = (ball['position'][2] - paddle_pos) / (GameConfig.PADDLE_HITBOX_HEIGHT / 2)
                angle = relative_hit_pos * (math.pi / 4)
                ball['velocity'][0] *= -1
                ball['velocity'][2] = GameConfig.BALL_SPEED * math.sin(angle)
                ball['position'][0] = paddle_x + (GameConfig.BALL_RADIUS * (1 if paddle_x < 0 else -1))
                return True
        return False
    def _stop_ball(self, game_state: Dict):
        game_state['ball']['position'] = [0, 0, 0]
        game_state['ball']['velocity'] = [0, 0, 0]
    def _reset_ball(self, game_state: Dict):
        game_state['ball']['position'] = [0, 0, 0]
        game_state['ball']['velocity'] = self._generate_initial_velocity()
    async def _update_clients(self, room: Dict):
        await self.channel_layer.group_send(
            room['room_group_name'],
            {
                'type': 'send_game_message',
                'message': {
                    'type': 'game_state',
                    'game_state': room['game_state'],
                },
            },
        )
    async def send_game_message(self, event):
        await self.send(text_data=json.dumps(event['message']))
    async def find_or_create_game_room(self):
        for room_name, room_data in self.game_rooms.items():
            if isinstance(room_data, dict) and 'players' in room_data:
                if len(room_data['players']) < 2:
                    return room_data
        room_name = str(uuid.uuid4())
        room = {
            'room_name': room_name,
            'room_group_name': f'pong_{room_name}',
            'players': {},
            'game_state': None
        }
        self.game_rooms[room_name] = room
        return room

class TournamentState(Enum):
    NOT_STARTED = "not_started"
    SEMIFINALS_1 = "semifinals_1"
    SEMIFINALS_2 = "semifinals_2"
    FINALS = "finals"
    COMPLETED = "completed"

class TournamentManager:
    def __init__(self):
        self.reset_tournament()
    def reset_tournament(self):
        self.players = ["player1", "player2", "player3", "player4"]
        self.player_nicknames = {}
        self.matches = {
            "semifinals_1": {"players": [], "winner": None},
            "semifinals_2": {"players": [], "winner": None},
            "finals": {"players": [], "winner": None}
        }
        self.state = TournamentState.NOT_STARTED
        self.current_match_rooms = {}
        self.player_to_channel = {}
    def set_player_nicknames(self, nicknames):
        self.player_nicknames = nicknames
    def initialize_tournament(self):
        self.reset_tournament()
        self.matches["semifinals_1"]["players"] = self.players[:2]
        self.matches["semifinals_2"]["players"] = self.players[2:]
        self.state = TournamentState.SEMIFINALS_1
    def get_current_match_players(self) -> Optional[List[str]]:
        if self.state == TournamentState.SEMIFINALS_1:
            players = self.matches["semifinals_1"]["players"]
            return [self.player_nicknames.get(p, p) for p in players]
        elif self.state == TournamentState.SEMIFINALS_2:
            players = self.matches["semifinals_2"]["players"]
            return [self.player_nicknames.get(p, p) for p in players]
        elif self.state == TournamentState.FINALS:
            players = self.matches["finals"]["players"]
            return [self.player_nicknames.get(p, p) for p in players]
        return None
    def register_player_channel(self, player_name: str, channel_name: str):
        self.player_to_channel[player_name] = channel_name
    def record_match_winner(self, match_id: str, winner: str):
        self.matches[match_id]["winner"] = winner
        if self.state == TournamentState.SEMIFINALS_1:
            self.state = TournamentState.SEMIFINALS_2
        elif self.state == TournamentState.SEMIFINALS_2:
            self.matches["finals"]["players"] = [
                self.matches["semifinals_1"]["winner"],
                self.matches["semifinals_2"]["winner"]
            ]
            self.state = TournamentState.FINALS
        elif self.state == TournamentState.FINALS:
            self.state = TournamentState.COMPLETED
    def get_tournament_status(self) -> Dict:
        return {
            "state": self.state.value,
            "matches": self.matches,
            "current_players": self.get_current_match_players()
        }

class PongGameTournamentConsumer(AsyncWebsocketConsumer):
    game_rooms = {}
    tournament_manager = TournamentManager()
    active_tournaments = {}
    async def connect(self):
        await self.accept()
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        self.token = params.get('token', [None])[0]
        if self.token not in self.active_tournaments:
            self.active_tournaments[self.token] = {
                'tournament': TournamentManager(),
                'creator_token': self.token
            }
        tournament_info = self.active_tournaments[self.token]
        self.tournament_manager = tournament_info['tournament']
        if (self.tournament_manager.state == TournamentState.NOT_STARTED and 
            self.token == tournament_info['creator_token']):
            self.tournament_manager.initialize_tournament()
        current_players = self.tournament_manager.get_current_match_players()
        if not current_players:
            await self.close()
            return
        if self.tournament_manager.state == TournamentState.NOT_STARTED:
            self.tournament_manager.initialize_tournament()
        current_players = self.tournament_manager.get_current_match_players()
        if not current_players:
            await self.close()
            return
        self.room_id = str(uuid.uuid4())
        if self.room_id not in self.game_rooms:
            self.game_rooms[self.room_id] = {
                'players': {},
                'game_state': self._create_initial_game_state()
            }
        player_side = self._assign_tournament_player_side(current_players)
        if player_side:
            await self.send(text_data=json.dumps({
                'type': 'players_ready',
                'player_side': player_side,
                'room_id': self.room_id,
                'tournament_status': self.tournament_manager.get_tournament_status()
            }))
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data['type'] == 'go_back':
                await self.match_canceled()
            if (data['type'] == 'setup_tournament_nicknames' and 
                self.token == self.active_tournaments[self.token]['creator_token']):
                self.tournament_manager.set_player_nicknames(data['nicknames'])
            elif data['type'] == 'paddle_move':
                await self._handle_paddle_move(data)
            elif data['type'] == 'start_game':
                await self._handle_start_game()
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Unexpected error: {str(e)}'
            }))    
    def _assign_tournament_player_side(self, current_players: List[str]) -> Optional[str]:
        if not self.game_rooms[self.room_id]['players'].get(PlayerSide.LEFT.value):
            self.game_rooms[self.room_id]['players'][PlayerSide.LEFT.value] = self.channel_name
            self.tournament_manager.register_player_channel(current_players[0], self.channel_name)
            return PlayerSide.LEFT.value
        elif not self.game_rooms[self.room_id]['players'].get(PlayerSide.RIGHT.value):
            self.game_rooms[self.room_id]['players'][PlayerSide.RIGHT.value] = self.channel_name
            self.tournament_manager.register_player_channel(current_players[1], self.channel_name)
            return PlayerSide.RIGHT.value
        return None
    async def match_canceled(self):
        self.tournament_manager.reset_tournament()
        if self.token in self.active_tournaments:
            del self.active_tournaments[self.token]
        if hasattr(self, 'room_id') and self.room_id in self.game_rooms:
            game_state = self.game_rooms[self.room_id]['game_state']
            game_state['playing'] = False
            del self.game_rooms[self.room_id]
            await self.close()
            # await self.send(text_data=json.dumps({
            #     'type': 'match_canceled',
            #     'message': 'Game Over'
            # }))
            
    async def match_finished(self):
        game_state = self.game_rooms[self.room_id]['game_state']
        scores = game_state['scores']
        game_state['playing'] = False  
        winner_side = PlayerSide.LEFT.value if scores[PlayerSide.LEFT.value] > scores[PlayerSide.RIGHT.value] else PlayerSide.RIGHT.value
        loser_side = PlayerSide.RIGHT.value if winner_side == PlayerSide.LEFT.value else PlayerSide.LEFT.value
        current_players = self.tournament_manager.get_current_match_players()
        winner = current_players[0] if winner_side == PlayerSide.LEFT.value else current_players[1]
        next_match = None
        if self.tournament_manager.state == TournamentState.SEMIFINALS_1:
            self.tournament_manager.record_match_winner("semifinals_1", winner)
            next_match = "semifinals_2"
        elif self.tournament_manager.state == TournamentState.SEMIFINALS_2:
            self.tournament_manager.record_match_winner("semifinals_2", winner)
            next_match = "finals"
        elif self.tournament_manager.state == TournamentState.FINALS:
            self.tournament_manager.record_match_winner("finals", winner)
        await asyncio.sleep(0.1)
        tournament_status = self.tournament_manager.get_tournament_status()
        await self.send(text_data=json.dumps({
            'type': 'match_finished',
            'winner': winner,
            'winnerscore': scores[winner_side],
            'loserscore': scores[loser_side],
            'tournament_status': tournament_status,
            'next_match': next_match
        }))
        if self.tournament_manager.state == TournamentState.COMPLETED:
            await asyncio.sleep(3)  
            self.tournament_manager.reset_tournament()
        elif next_match:
            await self.start_next_match(next_match)
    async def start_next_match(self, match_type):
        old_room_id = self.room_id
        self.room_id = str(uuid.uuid4())
        self.game_rooms[self.room_id] = {
            'players': {},
            'game_state': self._create_initial_game_state()
        }
        if old_room_id in self.game_rooms:
            del self.game_rooms[old_room_id]
        await self.send(text_data=json.dumps({
            'type': 'new_match',
            'match_type': match_type,
            'room_id': self.room_id,
            'tournament_status': self.tournament_manager.get_tournament_status()
        }))
    async def disconnect(self, close_code):
        if hasattr(self, 'room_id') and self.room_id in self.game_rooms:
            game_state = self.game_rooms[self.room_id]['game_state']
            game_state['playing'] = False
            del self.game_rooms[self.room_id]
    async def send_nicknames(self, event):
        await self.send(text_data=json.dumps({
            'type': 'nicknames_update',
            'nicknames': event['nicknames']
        }))
    async def _handle_paddle_move(self, data: Dict):
        game_state = self.game_rooms[self.room_id]['game_state']
        current_position = game_state['paddles'][data['player']]['position']
        new_position = self._calculate_new_paddle_position(
            current_position, 
            data['direction']
        )
        game_state['paddles'][data['player']]['position'] = new_position
        await self._update_clients()
    async def _handle_start_game(self):
        game_state = self.game_rooms[self.room_id]['game_state']
        if len(self.game_rooms[self.room_id]['players']) >= 1 and not game_state['playing']:
            game_state['playing'] = True
            asyncio.create_task(self._game_loop())
    async def _game_loop(self):
        last_frame_time = time.perf_counter()
        while self.game_rooms[self.room_id]['game_state']['playing']:
            current_time = time.perf_counter()
            delta_time = current_time - last_frame_time
            if delta_time >= GameConfig.FRAME_TIME:
                last_frame_time = current_time
                self._update_game_state(delta_time)
                await self._update_clients()
            await asyncio.sleep(0.001)
    def _create_initial_game_state(self) -> Dict:
        return {
            'ball': {
                'position': [0, 0.1, 0],
                'velocity': self._generate_initial_velocity(),
            },
            'paddles': {
                PlayerSide.LEFT.value: {'position': 0},
                PlayerSide.RIGHT.value: {'position': 0},
            },
            'scores': {PlayerSide.LEFT.value: 0, PlayerSide.RIGHT.value: 0},
            'playing': False,
        }
    def _generate_initial_velocity(self) -> List[float]:
        angle = random.uniform(-math.pi / 8, math.pi / 8)
        direction = random.choice([-1, 1])
        return [
            direction * GameConfig.BALL_SPEED,
            0,
            direction * GameConfig.BALL_SPEED * math.sin(angle),
        ]
    def _calculate_new_paddle_position(self, current_position: float, direction: str) -> float:
        if direction == 'up' and current_position > -GameConfig.PADDLE_BOUND:
            return current_position - GameConfig.PADDLE_SPEED
        elif direction == 'down' and current_position < GameConfig.PADDLE_BOUND:
            return current_position + GameConfig.PADDLE_SPEED
        return current_position
    def _update_game_state(self, delta_time: float):
        if self.room_id not in self.game_rooms:
            return
        game_state = self.game_rooms[self.room_id]['game_state']
        ball = game_state['ball']
        paddles = game_state['paddles']
        scores = game_state['scores']
        next_x = ball['position'][0] + ball['velocity'][0] * delta_time * 15
        next_z = ball['position'][2] + ball['velocity'][2] * delta_time * 15
        next_z = self._handle_z_boundary_collision(ball, next_z)
        ball['position'][0] = next_x
        ball['position'][2] = next_z
        self._check_paddle_and_goal_collisions(game_state)
    def _handle_z_boundary_collision(self, ball: Dict, next_z: float) :
        if next_z >= GameConfig.BALL_BOUND_Z:
            next_z = GameConfig.BALL_BOUND_Z - (next_z - GameConfig.BALL_BOUND_Z)
            ball['velocity'][2] *= -1
        elif next_z <= -GameConfig.BALL_BOUND_Z:
            next_z = -GameConfig.BALL_BOUND_Z + (-next_z - GameConfig.BALL_BOUND_Z)
            ball['velocity'][2] *= -1
        return next_z
    def _check_paddle_and_goal_collisions(self, game_state: Dict):
        ball = game_state['ball']
        paddles = game_state['paddles']
        scores = game_state['scores']
        for side in [PlayerSide.LEFT.value, PlayerSide.RIGHT.value]:
            paddle_x = -4.9 if side == PlayerSide.LEFT.value else 4.9
            if self._check_paddle_collision(ball, paddle_x, paddles[side]):
                continue
            if (side == PlayerSide.LEFT.value and ball['position'][0] < -5) or \
            (side == PlayerSide.RIGHT.value and ball['position'][0] > 5):
                scores[PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value] += 1
                asyncio.create_task(self._send_score_update(scores))
                if scores[PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value] >= 3:
                    asyncio.create_task(self.match_finished())
                    self._stop_ball(game_state)
                    break;
                self._reset_ball(game_state)
    async def _send_score_update(self, scores: Dict):
        await self.send(text_data=json.dumps({
            'type': 'score_update',
            'scores': {
                'left': scores[PlayerSide.LEFT.value],
                'right': scores[PlayerSide.RIGHT.value]
            },
            'room_id': self.room_id
        }))
    def _check_paddle_collision(self, ball: Dict, paddle_x: float, paddle: Dict) -> bool:
        if (paddle_x > 0 and ball['position'][0] >= paddle_x - GameConfig.BALL_RADIUS) or \
        (paddle_x < 0 and ball['position'][0] <= paddle_x + GameConfig.BALL_RADIUS):
            paddle_pos = paddle['position']
            z_distance = abs(ball['position'][2] - paddle_pos)
            if z_distance <= 0.6:
                relative_hit_pos = (ball['position'][2] - paddle_pos) / 0.6
                angle = relative_hit_pos * (math.pi / 4)
                ball['velocity'][0] *= -1
                ball['velocity'][2] = GameConfig.BALL_SPEED * math.sin(angle)
                ball['position'][0] = paddle_x + (GameConfig.BALL_RADIUS * (1 if paddle_x < 0 else -1))
                return True
        return False
    def _stop_ball(self, game_state: Dict):
        game_state['ball']['position'] = [0, 0.1, 0]
        game_state['ball']['velocity'] = [0, 0, 0]
    def _reset_ball(self, game_state: Dict):
        game_state['ball']['position'] = [0, 0.1, 0]
        game_state['ball']['velocity'] = self._generate_initial_velocity()
    async def _update_clients(self):
        if self.room_id in self.game_rooms:
            await self.send(text_data=json.dumps({
                'type': 'game_state',
                'game_state': self.game_rooms[self.room_id]['game_state'],
                'room_id': self.room_id
            }))
