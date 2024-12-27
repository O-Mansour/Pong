# import json
# import time
# import math
# import random
# import asyncio
# import uuid
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async

# class PongGameConsumer(AsyncWebsocketConsumer):
#     # Class-level dictionary to store active game rooms
#     game_rooms = {}

#     FPS = 120
#     FRAME_TIME = 1 / FPS
#     BALL_SPEED = 0.2
#     PADDLE_SPEED = 0.1
#     PADDLE_BOUND = 2.4  # Paddles can move within -2.4 to 2.4 on the z-axis
#     BALL_BOUND_Z = 2.9  # Ball bounces off at this z-axis boundary
#     PADDLE_HITBOX_HEIGHT = 1.2
#     PADDLE_HITBOX_WIDTH = 0.2
#     BALL_RADIUS = 0.1  # Ball radius

#     def generate_initial_velocity(self):
#         angle = random.uniform(-math.pi / 8, math.pi / 8)
#         direction = random.choice([-1, 1])
#         return [
#             direction * self.BALL_SPEED,
#             0, # no move in y-axes
#             direction * self.BALL_SPEED * math.sin(angle),
#         ]

#     async def connect(self):
#         # Accept the WebSocket connection
#         await self.accept()

#         # Find or create a game room
#         room = await self.find_or_create_game_room()

#         # Add this connection to the room
#         await self.channel_layer.group_add(room['room_group_name'], self.channel_name)

#         # Set room and player attributes
#         self.room_name = room['room_name']
#         self.room_group_name = room['room_group_name']
        
#         # Assign player side (left or right)
#         if not room['players'].get('left'):
#             self.player_side = 'left'
#             room['players']['left'] = self.channel_name
#         elif not room['players'].get('right'):
#             self.player_side = 'right'
#             room['players']['right'] = self.channel_name
#         else:
#             # Room is full
#             await self.send(text_data=json.dumps({
#                 'type': 'error',
#                 'message': 'Game room is full'
#             }))
#             await self.close()
#             return

#         # Initialize game state for both single and multi-player scenarios
#         if not room['game_state']:
#             room['game_state'] = {
#                 'ball': {
#                     'position': [0, 0.1, 0],
#                     'velocity': self.generate_initial_velocity(),
#                 },
#                 'paddles': {
#                     'left': {'position': 0},
#                     'right': {'position': 0},
#                 },
#                 'scores': {'left': 0, 'right': 0},
#                 'playing': False,
#             }

#         # Send player ready message
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'send_game_message',
#                 'message': {
#                     'type': 'players_ready',
#                     'players_count': len(room['players']),
#                     'player_side': self.player_side
#                 }
#             }
#         )

#     async def disconnect(self, close_code):
#         # Remove this connection from the room
#         if hasattr(self, 'room_name'):
#             room = self.game_rooms.get(self.room_name)
#             if room:
#                 # Remove the player from the room
#                 if self.player_side in room['players']:
#                     del room['players'][self.player_side]
                
#                 # Remove the room if no players left
#                 if not room['players']:
#                     del self.game_rooms[self.room_name]
                
#                 # Leave the group
#                 await self.channel_layer.group_discard(
#                     self.room_group_name, 
#                     self.channel_name
#                 )

#     async def receive(self, text_data):
#         data = json.loads(text_data)
        
#         # Validate the room exists
#         room = self.game_rooms.get(self.room_name)
#         if not room:
#             return

#         if data['type'] == 'paddle_move':
#             await self.handle_paddle_move(data)
#         elif data['type'] == 'start_game':
#             await self.handle_start_game()

#     async def handle_paddle_move(self, data):
#         room = self.game_rooms.get(self.room_name)
        
#         # If no game state, initialize it
#         if not room.get('game_state'):
#             room['game_state'] = {
#                 'ball': {
#                     'position': [0, 0.1, 0],
#                     'velocity': self.generate_initial_velocity(),
#                 },
#                 'paddles': {
#                     'left': {'position': 0},
#                     'right': {'position': 0},
#                 },
#                 'scores': {'left': 0, 'right': 0},
#                 'playing': False,
#             }
        
#         # If only one player exists, ensure both paddle entries are present
#         if len(room['players']) == 1:
#             side = list(room['players'].keys())[0]
#             opponent_side = 'right' if side == 'left' else 'left'
#             if opponent_side not in room['game_state']['paddles']:
#                 room['game_state']['paddles'][opponent_side] = {'position': 0}

#         # Ensure the move is for the correct player
#         if data['player'] != self.player_side:
#             return

#         current_position = room['game_state']['paddles'][data['player']]['position']

#         # Move the paddle within bounds
#         if data['direction'] == 'up' and current_position > -self.PADDLE_BOUND:
#             room['game_state']['paddles'][data['player']]['position'] -= self.PADDLE_SPEED
#         elif data['direction'] == 'down' and current_position < self.PADDLE_BOUND:
#             room['game_state']['paddles'][data['player']]['position'] += self.PADDLE_SPEED

#         await self.update_clients(room)

#     async def handle_start_game(self):
#         room = self.game_rooms.get(self.room_name)
        
#         # Start game if there's at least one player and game is not already playing
#         if len(room['players']) >= 1 and not room['game_state']['playing']:
#             # Use AI paddle for the missing player
#             missing_paddle_side = 'right' if 'right' not in room['players'] else 'left'
#             room['game_state']['playing'] = True
#             asyncio.create_task(self.game_loop(room))

#     async def game_loop(self, room):
#         last_frame_time = time.perf_counter()
#         while room['game_state']['playing']:
#             current_time = time.perf_counter()
#             delta_time = current_time - last_frame_time
#             if delta_time >= self.FRAME_TIME:
#                 last_frame_time = current_time
#                 self.update_game_state(room, delta_time)
#                 await self.update_clients(room)
#             await asyncio.sleep(0.001)
#     def update_game_state(self, room, delta_time):
#         game_state = room['game_state']
#         ball = game_state['ball']
#         paddles = game_state['paddles']
#         scores = game_state['scores']

#         # Update ball position with more precise boundary handling
#         next_x = ball['position'][0] + ball['velocity'][0] * delta_time * 15
#         next_z = ball['position'][2] + ball['velocity'][2] * delta_time * 15

#         # Precise boundary collision with reflection
#         if next_z >= self.BALL_BOUND_Z:
#             # Reflect ball from top boundary
#             next_z = self.BALL_BOUND_Z - (next_z - self.BALL_BOUND_Z)
#             ball['velocity'][2] *= -1
#         elif next_z <= -self.BALL_BOUND_Z:
#             # Reflect ball from bottom boundary
#             next_z = -self.BALL_BOUND_Z + (-next_z - self.BALL_BOUND_Z)
#             ball['velocity'][2] *= -1

#         # Update ball position
#         ball['position'][0] = next_x
#         ball['position'][2] = next_z

#         # Ball-paddle collision with more precise hitbox
#         def check_paddle_collision(side):
#             paddle_x = -4.9 if side == 'left' else 4.9
#             paddle_pos = paddles[side]['position']
            
#             # Precise x-coordinate collision check
#             if (side == 'left' and ball['position'][0] <= paddle_x + self.BALL_RADIUS) or \
#             (side == 'right' and ball['position'][0] >= paddle_x - self.BALL_RADIUS):
#                 # More precise z-position check with a small buffer
#                 z_distance = abs(ball['position'][2] - paddle_pos)
#                 if z_distance <= (self.PADDLE_HITBOX_HEIGHT / 2 + self.BALL_RADIUS):
#                     # Calculate reflection angle based on hit position
#                     relative_hit_pos = (ball['position'][2] - paddle_pos) / (self.PADDLE_HITBOX_HEIGHT / 2)
#                     angle = relative_hit_pos * (math.pi / 4)  # Max deflection angle
                    
#                     # Reverse x velocity and adjust z velocity based on hit position
#                     ball['velocity'][0] *= -1
#                     ball['velocity'][2] = self.BALL_SPEED * math.sin(angle)
                    
#                     # Push ball outside paddle hitbox
#                     ball['position'][0] = paddle_x + (self.BALL_RADIUS * (1 if side == 'left' else -1))
                    
#                     return True
#             return False

#         # Check collisions
#         if check_paddle_collision('left'):
#             pass
#         elif ball['position'][0] < -5:  # Left side goal
#             scores['right'] += 1
#             self.reset_ball(game_state)
        
#         if check_paddle_collision('right'):
#             pass
#         elif ball['position'][0] > 5:  # Right side goal
#             scores['left'] += 1
#             self.reset_ball(game_state)


#     def reset_ball(self, game_state):
#         game_state['ball']['position'] = [0, 0, 0]
#         game_state['ball']['velocity'] = self.generate_initial_velocity()

#     async def update_clients(self, room):
#         await self.channel_layer.group_send(
#             room['room_group_name'],
#             {
#                 'type': 'send_game_message',
#                 'message': {
#                     'type': 'game_state',
#                     'game_state': room['game_state'],
#                 },
#             },
#         )

#     async def send_game_message(self, event):
#         # Send message to WebSocket
#         await self.send(text_data=json.dumps(event['message']))

#     async def find_or_create_game_room(self):
#         for room in self.game_rooms.values():
#             if len(room['players']) < 2:
#                 return room

#         # create room
#         room_name = str(uuid.uuid4())
#         room = {
#             'room_name': room_name,
#             'room_group_name': f'pong_{room_name}',
#             'players': {},  # Will store 'left' and 'right' player channel names
#             'game_state': None
#         }
#         self.game_rooms[room_name] = room
#         return room



import json
import time
import math
import random
import asyncio
import uuid
from enum import Enum, auto
from typing import Dict, List, Optional
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class PlayerSide(Enum):
    LEFT = 'left'
    RIGHT = 'right'

class GameConfig:
    FPS = 120
    FRAME_TIME = 1 / FPS
    BALL_SPEED = 0.3
    PADDLE_SPEED = 0.1
    PADDLE_BOUND = 2.4  # Paddles can move within -2.4 to 2.4 on the z-axis
    BALL_BOUND_Z = 2.9  # Ball bounces off at this z-axis boundary
    PADDLE_HITBOX_HEIGHT = 1.2
    PADDLE_HITBOX_WIDTH = 0.2
    BALL_RADIUS = 0.1 
    PADDLE_X_POSITIONS = {
        PlayerSide.LEFT: -4.9,
        PlayerSide.RIGHT: 4.9
    }

class PongGameRemoteConsumer(AsyncWebsocketConsumer):

    # Class-level dictionary to store active game rooms
    game_rooms: Dict[str, Dict] = {}

    async def connect(self):
        await self.accept()

        try:
            room = await self.find_or_create_game_room()

            # Add this connection to the room
            await self.channel_layer.group_add(room['room_group_name'], self.channel_name)

            # Set room and player attributes
            self.room_name = room['room_name']
            self.room_group_name = room['room_group_name']
            self.player_side = self._assign_player_side(room)
            
            # Initialize game state if not exists
            if not room['game_state']:
                room['game_state'] = self._create_initial_game_state()

            # Notify players about room status
            await self._notify_players_ready(room)

        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Connection error: {str(e)}'
            }))
            await self.close()

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
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_game_message',
                'message': {
                    'type': 'players_ready',
                    'players_count': len(room['players']),
                    'player_side': self.player_side
                }
            }
        )

    def _generate_initial_velocity(self) -> List[float]:
        angle = random.uniform(-math.pi / 8, math.pi / 8)
        direction = random.choice([-1, 1])
        return [
            direction * GameConfig.BALL_SPEED,
            0,  # no move in y-axes
            direction * GameConfig.BALL_SPEED * math.sin(angle),
        ]

    async def disconnect(self, close_code):
        if not hasattr(self, 'room_name'):
            return

        room = self.game_rooms.get(self.room_name)
        if not room:
            return

        # Remove the player from the room
        if self.player_side in room['players']:
            del room['players'][self.player_side]
        
        # Remove the room if no players left
        if not room['players']:
            del self.game_rooms[self.room_name]
        
        # Leave the group
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

            if data['type'] == 'paddle_move':
                await self._handle_paddle_move(data, room)
            elif data['type'] == 'start_game':
                await self._handle_start_game(room)
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Unexpected error: {str(e)}'
            }))

    async def _handle_paddle_move(self, data: Dict, room: Dict):
        # Validate player side
        if data['player'] != self.player_side:
            return

        if not room.get('game_state'):
            room['game_state'] = self._create_initial_game_state()

        # Ensure both paddle entries exist
        self._ensure_both_paddles(room)

        # Move paddle
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
        if len(room['players']) >= 1 and not room['game_state']['playing']:
            room['game_state']['playing'] = True
            asyncio.create_task(self._game_loop(room))

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

        # Update ball position
        next_x = ball['position'][0] + ball['velocity'][0] * delta_time * 15
        next_z = ball['position'][2] + ball['velocity'][2] * delta_time * 15

        # Handle boundary collisions
        next_z = self._handle_z_boundary_collision(ball, next_z)

        # Update ball position
        ball['position'][0] = next_x
        ball['position'][2] = next_z

        # Check paddle collisions and goal scoring
        self._check_paddle_and_goal_collisions(game_state)

    def _handle_z_boundary_collision(self, ball: Dict, next_z: float) -> float:
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
            paddle_x = GameConfig.PADDLE_X_POSITIONS[PlayerSide(side)]
            
            if self._check_paddle_collision(ball, paddle_x, paddles[side]):
                continue
            
            # Check for goals
            if (side == PlayerSide.LEFT.value and ball['position'][0] < -5) or \
               (side == PlayerSide.RIGHT.value and ball['position'][0] > 5):
                scores[PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value] += 1
                
                # Check if a player has reached 5 points (winning condition)
                if scores[PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value] >= 2:
                    winning_side = PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value
                    # # delete the player from the room and create/join another room
                    # self._stop_ball(game_state)
                    print("winner is", winning_side)
                    # # print("another room created")
                    # self.find_or_create_game_room()
                    # print("another room created ", self.room_name)
                    
                self._reset_ball(game_state)


    def _check_paddle_collision(self, ball: Dict, paddle_x: float, paddle: Dict) -> bool:
        """Check and handle paddle collision."""
        if (paddle_x > 0 and ball['position'][0] >= paddle_x - GameConfig.BALL_RADIUS) or \
           (paddle_x < 0 and ball['position'][0] <= paddle_x + GameConfig.BALL_RADIUS):
            paddle_pos = paddle['position']
            z_distance = abs(ball['position'][2] - paddle_pos)
            
            if z_distance <= (GameConfig.PADDLE_HITBOX_HEIGHT / 2 + GameConfig.BALL_RADIUS):
                relative_hit_pos = (ball['position'][2] - paddle_pos) / (GameConfig.PADDLE_HITBOX_HEIGHT / 2)
                angle = relative_hit_pos * (math.pi / 4)
                
                ball['velocity'][0] *= -1
                ball['velocity'][2] = GameConfig.BALL_SPEED * math.sin(angle)
                
                # Push ball outside paddle hitbox
                ball['position'][0] = paddle_x + (GameConfig.BALL_RADIUS * (1 if paddle_x < 0 else -1))
                
                return True
        return False

    def _stop_ball(self, game_state: Dict):
        """Reset ball position and velocity."""
        game_state['ball']['position'] = [0, 0, 0]
        # game_state['ball']['velocity'] = self._generate_initial_velocity()

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
        """Send game message to WebSocket."""
        await self.send(text_data=json.dumps(event['message']))

    async def find_or_create_game_room(self):
        """Find an existing game room or create a new one."""
        # Find a room with less than 2 players
        
        for room in self.game_rooms.values():
            if len(room['players']) < 2:
                return room

        room_name = str(uuid.uuid4())
        # print("room name is ", room_name);
        room = {
            'room_name': room_name,
            'room_group_name': f'pong_{room_name}',
            'players': {},
            'game_state': None
        }
        self.game_rooms[room_name] = room
        return room

#######################################################
#######################################################


class PongGameLocalConsumer(AsyncWebsocketConsumer):
    game_room = None

    async def connect(self):
        await self.accept()

        # Ensure game room is initialized
        # if not PongGameLocalConsumer.game_room:
        PongGameLocalConsumer.game_room = {
            'players': {},
            'game_state': self._create_initial_game_state()
        }

        player_side = self._assign_player_side()

        # Notify player about their side
        await self.send(text_data=json.dumps({
            'type': 'players_ready',
            'players_count': len(PongGameLocalConsumer.game_room['players']),
            'player_side': player_side
        }))

    def _assign_player_side(self):
        if not PongGameLocalConsumer.game_room['players'].get(PlayerSide.LEFT.value):
            PongGameLocalConsumer.game_room['players'][PlayerSide.LEFT.value] = self.channel_name
            return PlayerSide.LEFT.value
        elif not PongGameLocalConsumer.game_room['players'].get(PlayerSide.RIGHT.value):
            PongGameLocalConsumer.game_room['players'][PlayerSide.RIGHT.value] = self.channel_name
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

    def _generate_initial_velocity(self) -> List[float]:
        angle = random.uniform(-math.pi / 8, math.pi / 8)
        direction = random.choice([-1, 1])
        return [
            direction * GameConfig.BALL_SPEED,
            0,
            direction * GameConfig.BALL_SPEED * math.sin(angle),
        ]

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)

            if data['type'] == 'paddle_move':
                await self._handle_paddle_move(data)
            elif data['type'] == 'start_game':
                await self._handle_start_game()
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Unexpected error: {str(e)}'
            }))

    async def _handle_paddle_move(self, data: Dict):
        game_state = PongGameLocalConsumer.game_room['game_state']
        current_position = game_state['paddles'][data['player']]['position']
        
        new_position = self._calculate_new_paddle_position(
            current_position, 
            data['direction']
        )
        game_state['paddles'][data['player']]['position'] = new_position

        await self._update_clients()

    def _calculate_new_paddle_position(self, current_position: float, direction: str) -> float:
        if direction == 'up' and current_position > -GameConfig.PADDLE_BOUND:
            return current_position - GameConfig.PADDLE_SPEED
        elif direction == 'down' and current_position < GameConfig.PADDLE_BOUND:
            return current_position + GameConfig.PADDLE_SPEED
        return current_position

    async def _handle_start_game(self):
        game_state = PongGameLocalConsumer.game_room['game_state']
        if len(PongGameLocalConsumer.game_room['players']) >= 1 and not game_state['playing']:
            game_state['playing'] = True
            asyncio.create_task(self._game_loop())

    async def _game_loop(self):
        last_frame_time = time.perf_counter()
        while PongGameLocalConsumer.game_room['game_state']['playing']:
            current_time = time.perf_counter()
            delta_time = current_time - last_frame_time
            
            if delta_time >= GameConfig.FRAME_TIME:
                last_frame_time = current_time
                self._update_game_state(delta_time)
                await self._update_clients()
            
            await asyncio.sleep(0.001)

    def _update_game_state(self, delta_time: float):
        game_state = PongGameLocalConsumer.game_room['game_state']
        ball = game_state['ball']
        paddles = game_state['paddles']
        scores = game_state['scores']

        # Update ball position
        next_x = ball['position'][0] + ball['velocity'][0] * delta_time * 15
        next_z = ball['position'][2] + ball['velocity'][2] * delta_time * 15

        # Handle boundary collisions
        next_z = self._handle_z_boundary_collision(ball, next_z)

        # Update ball position
        ball['position'][0] = next_x
        ball['position'][2] = next_z

        # Check paddle collisions and goal scoring
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
            
            # Check for goals
            if (side == PlayerSide.LEFT.value and ball['position'][0] < -5) or \
               (side == PlayerSide.RIGHT.value and ball['position'][0] > 5):
                scores[PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value] += 1
                
                if scores[PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value] >= 5:
                    self._stop_ball(game_state)
                    break;
                
                self._reset_ball(game_state)

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
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'game_state': PongGameLocalConsumer.game_room['game_state'],
        }))

    async def disconnect(self, close_code):
        # Remove the player from the game room
        if PongGameLocalConsumer.game_room:
            for side, channel_name in list(PongGameLocalConsumer.game_room['players'].items()):
                if channel_name == self.channel_name:
                    del PongGameLocalConsumer.game_room['players'][side]
                    break
            
            # Reset game room if no players
            if not PongGameLocalConsumer.game_room['players']:
                PongGameLocalConsumer.game_room = None





class PlayerSide(Enum):
    LEFT = 'left'
    RIGHT = 'right'

class GameConfig:
    FPS = 120
    FRAME_TIME = 1 / FPS
    BALL_SPEED = 0.4
    PADDLE_SPEED = 0.1
    PADDLE_BOUND = 2.4  # Paddles can move within -2.4 to 2.4 on the z-axis
    BALL_BOUND_Z = 2.9  # Ball bounces off at this z-axis boundary
    PADDLE_HITBOX_HEIGHT = 1.2
    PADDLE_HITBOX_WIDTH = 0.2
    BALL_RADIUS = 0.1 
    PADDLE_X_POSITIONS = {
        PlayerSide.LEFT: -4.9,
        PlayerSide.RIGHT: 4.9
    }

class TournamentState(Enum):
    QUALIFYING = 'qualifying'
    SEMIFINALS = 'semifinals'
    FINALS = 'finals'
    COMPLETED = 'completed'


class TournamentManager:
    def __init__(self):
        self.tournaments: Dict[str, Dict] = {}
        self.player_tournament_map: Dict[str, str] = {}  # Maps player channel names to tournament IDs
        self.current_matches: Dict[str, List[str]] = {}  # Maps tournament ID to current match rooms
    
    def create_tournament(self) -> str:
        """Create a new tournament and return its ID."""
        tournament_id = str(uuid.uuid4())
        self.tournaments[tournament_id] = {
            'state': TournamentState.QUALIFYING,
            'matches': {
                'semifinals': [],  # Will store two semifinal matches
                'finals': None     # Will store the final match
            },
            'winners': {},        # Maps room ID to winner's channel name
            'champion': None
        }
        self.current_matches[tournament_id] = []
        return tournament_id
    
    

    def record_winner(self, room_id: str, winner_channel: str) -> Dict:
        """Record the winner of a match and handle tournament progression."""
        tournament_id = self.player_tournament_map.get(winner_channel)
        if not tournament_id:
            return None

        tournament = self.tournaments[tournament_id]
        tournament['winners'][room_id] = winner_channel

        return self._check_tournament_progression(tournament_id)


    def verify_winner(self, tournament_id: str, player_channel: str) -> bool:
        """Verify if a player won their first match in the tournament."""
        history = self.match_history.get(tournament_id, [])
        if not history:
            return False
            
        # Check if player won the first match
        first_match = next((match for match in history if match['match_number'] == 1), None)
        if first_match:
            return first_match['winner_channel'] == player_channel
        return False

    
    def register_player(self, tournament_id: str, player_channel: str):
        """Register a player to a tournament."""
        if tournament_id in self.tournaments:
            self.player_tournament_map[player_channel] = tournament_id

    def add_match_to_tournament(self, tournament_id: str, room_id: str):
        """Add a match room to the tournament."""
        if tournament_id in self.tournaments:
            if self.tournaments[tournament_id]['state'] == TournamentState.QUALIFYING:
                self.current_matches[tournament_id].append(room_id)
            
            if len(self.current_matches[tournament_id]) <= 2:
                self.tournaments[tournament_id]['matches']['semifinals'].append(room_id)

    def record_winner(self, room_id: str, winner_channel: str) -> Dict:
        """Record the winner of a match and handle tournament progression."""
        tournament_id = self.player_tournament_map.get(winner_channel)
        if not tournament_id:
            return None

        tournament = self.tournaments[tournament_id]
        tournament['winners'][room_id] = winner_channel
        print("the winner is : ", winner_channel)
        return self._check_tournament_progression(tournament_id)

    def _check_tournament_progression(self, tournament_id: str) -> Dict:
        """Check and progress tournament state based on winners."""
        print("the tournament is : ", tournament_id)
        tournament = self.tournaments[tournament_id]
        winners = list(tournament['winners'].values())

        if tournament['state'] == TournamentState.QUALIFYING:
            # When we have two winners from semifinals
            if len(winners) == 2:
                tournament['state'] = TournamentState.FINALS
                return {
                    'type': 'tournament_update',
                    'state': TournamentState.FINALS.value,
                    'message': 'Semifinals completed. Moving to finals.',
                    'winners': winners
                }
        
        elif tournament['state'] == TournamentState.FINALS:
            # When we have a champion
            if len(winners) == 3:  # Two semifinal winners + one final winner
                tournament['state'] = TournamentState.COMPLETED
                tournament['champion'] = winners[-1]  # Last winner is the champion
                return {
                    'type': 'tournament_update',
                    'state': TournamentState.COMPLETED.value,
                    'message': 'Tournament completed!',
                    'champion': tournament['champion']
                }

        return None

    def get_tournament_state(self, tournament_id: str) -> Dict:
        """Get the current state of a tournament."""
        return self.tournaments.get(tournament_id)

    def create_finals_match(self, tournament_id: str) -> str:
        """Create a finals match ID."""
        finals_id = str(uuid.uuid4())
        self.tournaments[tournament_id]['matches']['finals'] = finals_id
        return finals_id

    def get_match_winners(self, tournament_id: str) -> List[str]:
        """Get list of winners for the current tournament stage."""
        return list(self.tournaments[tournament_id]['winners'].values())

class PongGameTournamentConsumer(AsyncWebsocketConsumer):
    game_rooms: Dict[str, Dict] = {}
    tournament_manager = TournamentManager()  # Add this line

    async def connect(self):
        await self.accept()

        try:
            # First find or create a game room
            room = await self.find_or_create_game_room()
            
            # Set room attributes immediately
            self.room_name = room['room_name']
            self.room_group_name = room['room_group_name']
            
            # Add this connection to the room
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            # Set player side
            self.player_side = self._assign_player_side(room)
            
            # Handle tournament logic
            if len(self.game_rooms) <= 1:
                self.tournament_id = self.tournament_manager.create_tournament()
            else:
                # Get tournament ID from any existing player
                for existing_room in self.game_rooms.values():
                    if existing_room['players']:
                        existing_player = next(iter(existing_room['players'].values()))
                        self.tournament_id = self.tournament_manager.player_tournament_map.get(existing_player)
                        break
                if not hasattr(self, 'tournament_id'):
                    self.tournament_id = self.tournament_manager.create_tournament()

            # Register player in tournament
            self.tournament_manager.register_player(self.tournament_id, self.channel_name)
            self.tournament_manager.add_match_to_tournament(self.tournament_id, self.room_name)
            
            # Initialize game state if not exists
            if not room['game_state']:
                room['game_state'] = self._create_initial_game_state()

            # Notify players about room status
            await self._notify_players_ready(room)

        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Connection error: {str(e)}'
            }))
            await self.close()

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
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_game_message',
                'message': {
                    'type': 'players_ready',
                    'players_count': len(room['players']),
                    'player_side': self.player_side
                }
            }
        )

    def _generate_initial_velocity(self) -> List[float]:
        angle = random.uniform(-math.pi / 8, math.pi / 8)
        direction = random.choice([-1, 1])
        return [
            direction * GameConfig.BALL_SPEED,
            0,
            direction * GameConfig.BALL_SPEED * math.sin(angle),
        ]

    async def disconnect(self, close_code):
        if not hasattr(self, 'room_name'):
            return

        room = self.game_rooms.get(self.room_name)
        if not room:
            return

        # Remove the player from the room
        if self.player_side in room['players']:
            del room['players'][self.player_side]
        
        # Remove the room if no players left
        if not room['players']:
            del self.game_rooms[self.room_name]
        
        # Leave the group
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

            if data['type'] == 'paddle_move':
                await self._handle_paddle_move(data, room)
            elif data['type'] == 'start_game':
                await self._handle_start_game(room)
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Unexpected error: {str(e)}'
            }))

    async def _handle_paddle_move(self, data: Dict, room: Dict):
        """Handle paddle movement request."""
        # Validate player side
        if data['player'] != self.player_side:
            return

        # Ensure game state exists
        if not room.get('game_state'):
            room['game_state'] = self._create_initial_game_state()

        # Ensure both paddle entries exist
        self._ensure_both_paddles(room)

        # Move paddle
        current_position = room['game_state']['paddles'][data['player']]['position']
        new_position = self._calculate_new_paddle_position(
            current_position, 
            data['direction']
        )
        room['game_state']['paddles'][data['player']]['position'] = new_position

        await self._update_clients(room)

    def _calculate_new_paddle_position(self, current_position: float, direction: str) -> float:
        """Calculate new paddle position with boundary checks."""
        if direction == 'up' and current_position > -GameConfig.PADDLE_BOUND:
            return current_position - GameConfig.PADDLE_SPEED
        elif direction == 'down' and current_position < GameConfig.PADDLE_BOUND:
            return current_position + GameConfig.PADDLE_SPEED
        return current_position

    def _ensure_both_paddles(self, room: Dict):
        """Ensure both paddle entries exist in game state."""
        if len(room['players']) == 1:
            existing_side = list(room['players'].keys())[0]
            missing_side = PlayerSide.RIGHT.value if existing_side == PlayerSide.LEFT.value else PlayerSide.LEFT.value
            room['game_state']['paddles'][missing_side] = {'position': 0}

    async def _handle_start_game(self, room: Dict):
        """Start the game if conditions are met."""
        if len(room['players']) >= 1 and not room['game_state']['playing']:
            room['game_state']['playing'] = True
            asyncio.create_task(self._game_loop(room))

    async def _game_loop(self, room: Dict):
        """Main game loop for updating game state."""
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
        """Update game state including ball movement and collisions."""
        game_state = room['game_state']
        ball = game_state['ball']
        paddles = game_state['paddles']
        scores = game_state['scores']

        # Update ball position
        next_x = ball['position'][0] + ball['velocity'][0] * delta_time * 15
        next_z = ball['position'][2] + ball['velocity'][2] * delta_time * 15

        # Handle boundary collisions
        next_z = self._handle_z_boundary_collision(ball, next_z)

        # Update ball position
        ball['position'][0] = next_x
        ball['position'][2] = next_z

        # Check paddle collisions and goal scoring
        self._check_paddle_and_goal_collisions(game_state)

    def _handle_z_boundary_collision(self, ball: Dict, next_z: float) -> float:
        """Handle ball collisions with Z boundaries."""
        if next_z >= GameConfig.BALL_BOUND_Z:
            next_z = GameConfig.BALL_BOUND_Z - (next_z - GameConfig.BALL_BOUND_Z)
            ball['velocity'][2] *= -1
        elif next_z <= -GameConfig.BALL_BOUND_Z:
            next_z = -GameConfig.BALL_BOUND_Z + (-next_z - GameConfig.BALL_BOUND_Z)
            ball['velocity'][2] *= -1
        return next_z

    async def create_semifinal_room(self, tournament_id: str, consumer):
        """Create a new room for semifinals."""
        semifinal_room = await consumer.find_or_create_game_room()
        self.tournaments[tournament_id]['semifinal_room'] = semifinal_room['room_name']
        return semifinal_room

    async def _handle_tournament_progression(self, room: Dict, winning_side: str):
        """Handle tournament progression after a game ends."""
        winner_channel = room['players'].get(winning_side)
        if not winner_channel:
            return

         # Record the winner
        tournament_update = self.tournament_manager.record_winner(room['room_name'], winner_channel)
        
        if tournament_update:
            tournament_id = self.tournament_manager.player_tournament_map[winner_channel]
            
            # # Get and print match history
            history = self.tournament_manager.get_match_history(tournament_id)
            print("\nTournament Match History:")
            for match in history:
                print(f"Match {match['match_number']}:")
                print(f"  Room: {match['room_id']}")
                print(f"  Winner: {match['winner_channel']}")
                print(f"  State: {match['tournament_state']}")

            # Verify if this player won their first match
            # first_match_winner = self.tournament_manager.verify_winner(tournament_id, winner_channel)
            # print(f"\nDid {winner_channel} win their first match? {first_match_winner}")
            
            # Send tournament update to all players
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_game_message',
                    'message': tournament_update
                }
            )

            # Handle progression to finals
            if tournament_update['state'] == TournamentState.FINALS.value:
                winners = tournament_update['winners']
                if len(winners) == 2:
                    # Create new room for finals
                    finals_room = await self.find_or_create_game_room()
                    finals_room['game_state'] = self._create_initial_game_state()  # Reset game state for finals
                    self.tournament_manager.tournaments[tournament_id]['matches']['finals'] = finals_room['room_name']
                    
                    # Move both semifinal winners to finals room
                    for winner in winners:
                        await self._move_winner_to_next_room(winner, finals_room)
            
            # Handle tournament completion
            elif tournament_update['state'] == TournamentState.COMPLETED.value:
                # Get final tournament history
                final_history = self.tournament_manager.get_match_history(tournament_id)
                print("\nFinal Tournament Results:")
                print(f"Champion: {tournament_update['champion']}")
                print("Complete Match History:")
                for match in final_history:
                    print(f"Match {match['match_number']} - Winner: {match['winner_channel']}")

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'send_game_message',
                        'message': {
                            'type': 'tournament_complete',
                            'champion': tournament_update['champion']
                        }
                    }
                )

    async def _move_winner_to_next_room(self, winner_channel: str, next_room: Dict):
        """Move winning player to the next tournament room."""
        # Remove from current room
        current_room = self.game_rooms.get(self.room_name)
        if current_room:
            for side, channel in list(current_room['players'].items()):
                if channel == winner_channel:
                    del current_room['players'][side]
                    break

        # Add winner to new room with appropriate side
        if not next_room['players'].get(PlayerSide.LEFT.value):
            next_room['players'][PlayerSide.LEFT.value] = winner_channel
        elif not next_room['players'].get(PlayerSide.RIGHT.value):
            next_room['players'][PlayerSide.RIGHT.value] = winner_channel

        # Remove from current room's channel layer group
        await self.channel_layer.group_discard(
            self.room_group_name,
            winner_channel
        )

        # Add to new room's channel layer group
        new_room_group_name = f'pong_{next_room["room_name"]}'
        await self.channel_layer.group_add(
            new_room_group_name,
            winner_channel
        )

        # Send move message to winner
        await self.channel_layer.send(
            winner_channel,
            {
                'type': 'send_game_message',
                'message': {
                    'type': 'move_to_room',
                    'room_name': next_room['room_name'],
                    'room_group_name': new_room_group_name,
                    'result': 'victory'
                }
            }
        )

        # If both players are in the new room, initialize a fresh game state
        if len(next_room['players']) == 2:
            next_room['game_state'] = self._create_initial_game_state()
            await self.channel_layer.group_send(
                new_room_group_name,
                {
                    'type': 'send_game_message',
                    'message': {
                        'type': 'game_state',
                        'game_state': next_room['game_state'],
                    }
                }
            )

    def _check_paddle_and_goal_collisions(self, game_state: Dict):
        """Check paddle collisions and score goals."""
        ball = game_state['ball']
        paddles = game_state['paddles']
        scores = game_state['scores']

        for side in [PlayerSide.LEFT.value, PlayerSide.RIGHT.value]:
            paddle_x = GameConfig.PADDLE_X_POSITIONS[PlayerSide(side)]
            
            if self._check_paddle_collision(ball, paddle_x, paddles[side]):
                continue
            
            # Check for goals
            if (side == PlayerSide.LEFT.value and ball['position'][0] < -5) or \
            (side == PlayerSide.RIGHT.value and ball['position'][0] > 5):
                scoring_side = PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value
                scores[scoring_side] += 1
                
                # Check if a player has reached 5 points (winning condition)
                if scores[scoring_side] >= 2:
                    game_state['playing'] = False  # Stop the game
                    self._stop_ball(game_state)
                    
                    # Handle tournament progression with winner movement
                    room = self.game_rooms[self.room_name]
                    asyncio.create_task(self._handle_tournament_progression(room, scoring_side))
                    return  # Exit early since game is over
                    
                self._reset_ball(game_state)


    def _check_paddle_collision(self, ball: Dict, paddle_x: float, paddle: Dict) -> bool:
        """Check and handle paddle collision."""
        if (paddle_x > 0 and ball['position'][0] >= paddle_x - GameConfig.BALL_RADIUS) or \
           (paddle_x < 0 and ball['position'][0] <= paddle_x + GameConfig.BALL_RADIUS):
            paddle_pos = paddle['position']
            z_distance = abs(ball['position'][2] - paddle_pos)
            
            if z_distance <= (GameConfig.PADDLE_HITBOX_HEIGHT / 2 + GameConfig.BALL_RADIUS):
                # Calculate reflection angle
                relative_hit_pos = (ball['position'][2] - paddle_pos) / (GameConfig.PADDLE_HITBOX_HEIGHT / 2)
                angle = relative_hit_pos * (math.pi / 4)
                
                ball['velocity'][0] *= -1
                ball['velocity'][2] = GameConfig.BALL_SPEED * math.sin(angle)
                
                # Push ball outside paddle hitbox
                ball['position'][0] = paddle_x + (GameConfig.BALL_RADIUS * (1 if paddle_x < 0 else -1))
                
                return True
        return False

    def _stop_ball(self, game_state: Dict):
        """Reset ball position and velocity."""
        game_state['ball']['position'] = [0, 0, 0]
        # game_state['ball']['velocity'] = self._generate_initial_velocity()

    def _reset_ball(self, game_state: Dict):
        """Reset ball position and velocity."""
        game_state['ball']['position'] = [0, 0, 0]
        game_state['ball']['velocity'] = self._generate_initial_velocity()

    async def _update_clients(self, room: Dict):
        """Send updated game state to all clients in the room."""
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

    async def _disconnect_losing_player(self, room: Dict, losing_side: str):
        """Disconnect the losing player from the current room."""
        losing_channel = room['players'].get(losing_side)
        if losing_channel:
            # Send disconnect message to losing player
            await self.channel_layer.send(
                losing_channel,
                {
                    'type': 'send_game_message',
                    'message': {
                        'type': 'game_over',
                        'result': 'defeat'
                    }
                }
            )
            # Remove player from room
            del room['players'][losing_side]
            # Remove from channel layer group
            await self.channel_layer.group_discard(
                self.room_group_name,
                losing_channel
            )

    
    async def send_game_message(self, event):
        """Send game message to WebSocket."""
        await self.send(text_data=json.dumps(event['message']))

    async def find_or_create_game_room(self):
        """Find an existing game room or create a new one."""
        # Find a room with less than 2 players
        
        for room in self.game_rooms.values():
            if len(room['players']) < 2:
                return room

        # Create a new room
        room_name = str(uuid.uuid4())
        # print("room name is ", room_name);
        room = {
            'room_name': room_name,
            'room_group_name': f'pong_{room_name}',
            'players': {},
            'game_state': None
        }
        self.game_rooms[room_name] = room
        return room


# class PlayerSide(Enum):
#     LEFT = 'left'
#     RIGHT = 'right'

# class GameConfig:
#     FPS = 120
#     FRAME_TIME = 1 / FPS
#     BALL_SPEED = 0.3
#     PADDLE_SPEED = 0.1
#     PADDLE_BOUND = 2.4
#     BALL_BOUND_Z = 2.9
#     PADDLE_HITBOX_HEIGHT = 1.2
#     PADDLE_HITBOX_WIDTH = 0.2
#     BALL_RADIUS = 0.1 
#     PADDLE_X_POSITIONS = {
#         PlayerSide.LEFT: -4.9,
#         PlayerSide.RIGHT: 4.9
#     }

# class TournamentState(Enum):
#     QUALIFYING = 'qualifying'
#     SEMIFINALS = 'semifinals'
#     FINALS = 'finals'
#     COMPLETED = 'completed'

# class TournamentManager:
#     def __init__(self):
#         self.tournaments = {}
#         self.player_tournament_map = {}
#         self.match_history = {}
#         self.qualified_players = {}  # Add this to track qualified players

#     def create_tournament(self):
#         tournament_id = str(uuid.uuid4())
#         self.tournaments[tournament_id] = {
#             'state': TournamentState.QUALIFYING,
#             'matches': [],
#             'winners': [],
#             'champion': None
#         }
#         self.match_history[tournament_id] = []
#         self.qualified_players[tournament_id] = set()  # Initialize qualified players set
#         return tournament_id

#     def register_player(self, tournament_id, player_channel):
#         if tournament_id in self.tournaments:
#             self.player_tournament_map[player_channel] = tournament_id

#     def record_winner(self, room_id, winner_channel):
#         tournament_id = self.player_tournament_map.get(winner_channel)
#         if not tournament_id:
#             return None

#         tournament = self.tournaments[tournament_id]
        
#         # Record match in history
#         self.match_history[tournament_id].append({
#             'room_id': room_id,
#             'winner': winner_channel,
#             'state': tournament['state'].value
#         })

#         if tournament['state'] == TournamentState.QUALIFYING:
#             # Add winner to qualified players set
#             self.qualified_players[tournament_id].add(winner_channel)
#             print("this player moved to the semi : ", winner_channel)
            
#             # Progress to finals when we have 2 qualified players
#             if len(self.qualified_players[tournament_id]) == 2:
#                 tournament['state'] = TournamentState.FINALS
#                 tournament['winners'] = list(self.qualified_players[tournament_id])
#                 return {
#                     'type': 'tournament_update',
#                     'state': TournamentState.FINALS.value,
#                     'message': 'Moving to finals',
#                     'winners': tournament['winners']
#                 }
                
#         elif tournament['state'] == TournamentState.FINALS:
#             # Only allow qualified players to win the finals
#             if winner_channel in self.qualified_players[tournament_id]:
#                 tournament['state'] = TournamentState.COMPLETED
#                 tournament['champion'] = winner_channel
#                 return {
#                     'type': 'tournament_update',
#                     'state': TournamentState.COMPLETED.value,
#                     'message': 'Tournament completed!',
#                     'champion': winner_channel
#                 }

#         return None
#     async def _handle_winner(self, room, winning_side):
#         winner_channel = room['players'][winning_side]
#         tournament_update = self.tournament_manager.record_winner(room['room_name'], winner_channel)
        
#         if tournament_update:
#             if tournament_update['state'] == TournamentState.FINALS:
#                 # Create new finals room
#                 finals_room = await self.find_or_create_game_room()
#                 finals_room['game_state'] = self._create_initial_game_state()
                
#                 # Move only qualified winners to finals room
#                 for winner in tournament_update['winners']:
#                     await self._move_player_to_room(winner, finals_room)
            
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'send_game_message',
#                     'message': tournament_update
#                 }
#             )


# class PongGameTournamentConsumer(AsyncWebsocketConsumer):
#     game_rooms = {}
#     tournament_manager = TournamentManager()

#     async def connect(self):
#         await self.accept()
        
#         # Find or create a game room
#         room = await self.find_or_create_game_room()
#         self.room_name = room['room_name']
#         self.room_group_name = room['room_group_name']
        
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         self.player_side = self._assign_player_side(room)

#         # Handle tournament setup
#         if len(self.game_rooms) <= 1:
#             self.tournament_id = self.tournament_manager.create_tournament()
#         else:
#             # Get tournament ID from existing player
#             for existing_room in self.game_rooms.values():
#                 if existing_room['players']:
#                     existing_player = next(iter(existing_room['players'].values()))
#                     self.tournament_id = self.tournament_manager.player_tournament_map.get(existing_player)
#                     break
#             if not hasattr(self, 'tournament_id'):
#                 self.tournament_id = self.tournament_manager.create_tournament()

#         # Register player in tournament
#         self.tournament_manager.register_player(self.tournament_id, self.channel_name)

#         # Initialize game state
#         if not room['game_state']:
#             room['game_state'] = self._create_initial_game_state()

#         await self._notify_players_ready(room)

#     async def disconnect(self, close_code):
#         if hasattr(self, 'room_name'):
#             room = self.game_rooms.get(self.room_name)
#             if room:
#                 if self.player_side in room['players']:
#                     del room['players'][self.player_side]
#                 if not room['players']:
#                     del self.game_rooms[self.room_name]
#                 await self.channel_layer.group_discard(
#                     self.room_group_name, 
#                     self.channel_name
#                 )

#     def _assign_player_side(self, room):
#         if not room['players'].get(PlayerSide.LEFT.value):
#             room['players'][PlayerSide.LEFT.value] = self.channel_name
#             return PlayerSide.LEFT.value
#         elif not room['players'].get(PlayerSide.RIGHT.value):
#             room['players'][PlayerSide.RIGHT.value] = self.channel_name
#             return PlayerSide.RIGHT.value
#         else:
#             raise ValueError('Game room is full')

#     def _create_initial_game_state(self):
#         return {
#             'ball': {
#                 'position': [0, 0.1, 0],
#                 'velocity': self._generate_initial_velocity(),
#             },
#             'paddles': {
#                 PlayerSide.LEFT.value: {'position': 0},
#                 PlayerSide.RIGHT.value: {'position': 0},
#             },
#             'scores': {PlayerSide.LEFT.value: 0, PlayerSide.RIGHT.value: 0},
#             'playing': False,
#         }

#     def _generate_initial_velocity(self):
#         angle = random.uniform(-math.pi / 8, math.pi / 8)
#         direction = random.choice([-1, 1])
#         return [
#             direction * GameConfig.BALL_SPEED,
#             0,
#             direction * GameConfig.BALL_SPEED * math.sin(angle),
#         ]

#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         room = self.game_rooms.get(self.room_name)
        
#         if not room:
#             return

#         if data['type'] == 'paddle_move':
#             await self._handle_paddle_move(data, room)
#         elif data['type'] == 'start_game':
#             await self._handle_start_game(room)

#     async def _handle_paddle_move(self, data, room):
#         if data['player'] != self.player_side:
#             return

#         current_position = room['game_state']['paddles'][data['player']]['position']
#         new_position = current_position
        
#         if data['direction'] == 'up' and current_position > -GameConfig.PADDLE_BOUND:
#             new_position = current_position - GameConfig.PADDLE_SPEED
#         elif data['direction'] == 'down' and current_position < GameConfig.PADDLE_BOUND:
#             new_position = current_position + GameConfig.PADDLE_SPEED
            
#         room['game_state']['paddles'][data['player']]['position'] = new_position
#         await self._update_clients(room)

#     async def _handle_start_game(self, room):
#         if len(room['players']) >= 1 and not room['game_state']['playing']:
#             room['game_state']['playing'] = True
#             asyncio.create_task(self._game_loop(room))

#     async def _game_loop(self, room):
#         last_frame_time = time.perf_counter()
#         while room['game_state']['playing']:
#             current_time = time.perf_counter()
#             delta_time = current_time - last_frame_time
            
#             if delta_time >= GameConfig.FRAME_TIME:
#                 last_frame_time = current_time
#                 self._update_game_state(room, delta_time)
#                 await self._update_clients(room)
            
#             await asyncio.sleep(0.001)

#     def _update_game_state(self, room, delta_time):
#         game_state = room['game_state']
#         ball = game_state['ball']

#         # Update ball position
#         next_x = ball['position'][0] + ball['velocity'][0] * delta_time * 15
#         next_z = ball['position'][2] + ball['velocity'][2] * delta_time * 15

#         # Handle Z boundary collisions
#         if abs(next_z) >= GameConfig.BALL_BOUND_Z:
#             next_z = GameConfig.BALL_BOUND_Z * (1 if next_z > 0 else -1)
#             ball['velocity'][2] *= -1

#         ball['position'][0] = next_x
#         ball['position'][2] = next_z

#         # Check paddle collisions and scoring
#         self._handle_collisions_and_scoring(game_state, room)

#     def _handle_collisions_and_scoring(self, game_state, room):
#         ball = game_state['ball']
#         for side in [PlayerSide.LEFT.value, PlayerSide.RIGHT.value]:
#             paddle_x = GameConfig.PADDLE_X_POSITIONS[PlayerSide(side)]
#             paddle_pos = game_state['paddles'][side]['position']
            
#             # Paddle collision
#             if ((paddle_x > 0 and ball['position'][0] >= paddle_x - GameConfig.BALL_RADIUS) or 
#                 (paddle_x < 0 and ball['position'][0] <= paddle_x + GameConfig.BALL_RADIUS)):
                
#                 if abs(ball['position'][2] - paddle_pos) <= (GameConfig.PADDLE_HITBOX_HEIGHT / 2 + GameConfig.BALL_RADIUS):
#                     relative_hit_pos = (ball['position'][2] - paddle_pos) / (GameConfig.PADDLE_HITBOX_HEIGHT / 2)
#                     angle = relative_hit_pos * (math.pi / 4)
                    
#                     ball['velocity'][0] *= -1
#                     ball['velocity'][2] = GameConfig.BALL_SPEED * math.sin(angle)
#                     ball['position'][0] = paddle_x + (GameConfig.BALL_RADIUS * (1 if paddle_x < 0 else -1))
#                     return

#             # Scoring
#             if ((side == PlayerSide.LEFT.value and ball['position'][0] < -5) or 
#                 (side == PlayerSide.RIGHT.value and ball['position'][0] > 5)):
#                 scoring_side = PlayerSide.RIGHT.value if side == PlayerSide.LEFT.value else PlayerSide.LEFT.value
#                 game_state['scores'][scoring_side] += 1
                
#                 if game_state['scores'][scoring_side] >= 2:  # Win condition
#                     game_state['playing'] = False
#                     ball['position'] = [0, 0, 0]
#                     ball['velocity'] = [0, 0, 0]
                    
#                     # Handle tournament progression
#                     winner_channel = room['players'][scoring_side]
#                     asyncio.create_task(self._handle_winner(room, scoring_side))
#                 else:
#                     ball['position'] = [0, 0.1, 0]
#                     ball['velocity'] = self._generate_initial_velocity()

#     async def _handle_winner(self, room, winning_side):
#         winner_channel = room['players'][winning_side]
#         tournament_update = self.tournament_manager.record_winner(room['room_name'], winner_channel)
        
#         if tournament_update:
#             if tournament_update['state'] == TournamentState.FINALS:
#                 # Create new finals room
#                 finals_room = await self.find_or_create_game_room()
#                 finals_room['game_state'] = self._create_initial_game_state()
                
#                 # Move winners to finals room
#                 for winner in tournament_update['winners']:
#                     await self._move_player_to_room(winner, finals_room)
                    
#             # Send tournament update to all players
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'send_game_message',
#                     'message': tournament_update
#                 }
#             )

#     async def _move_player_to_room(self, player_channel, new_room):
#         # Remove from current room
#         old_room = None
#         for room in self.game_rooms.values():
#             for side, channel in room['players'].items():
#                 if channel == player_channel:
#                     old_room = room
#                     del room['players'][side]
#                     break
#             if old_room:
#                 break

#         if old_room:
#             # Add to new room
#             new_side = PlayerSide.LEFT.value if not new_room['players'] else PlayerSide.RIGHT.value
#             new_room['players'][new_side] = player_channel
            
#             # Update channel groups
#             await self.channel_layer.group_discard(
#                 f"pong_{old_room['room_name']}",
#                 player_channel
#             )
#             await self.channel_layer.group_add(
#                 f"pong_{new_room['room_name']}",
#                 player_channel
#             )

#     async def _notify_players_ready(self, room):
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'send_game_message',
#                 'message': {
#                     'type': 'players_ready',
#                     'players_count': len(room['players']),
#                     'player_side': self.player_side
#                 }
#             }
#         )

#     async def _update_clients(self, room):
#         await self.channel_layer.group_send(
#             room['room_group_name'],
#             {
#                 'type': 'send_game_message',
#                 'message': {
#                     'type': 'game_state',
#                     'game_state': room['game_state'],
#                 },
#             },
#         )

#     async def send_game_message(self, event):
#         await self.send(text_data=json.dumps(event['message']))

#     async def find_or_create_game_room(self):
#         for room in self.game_rooms.values():
#             if len(room['players']) < 2:
#                 return room

#         room_name = str(uuid.uuid4())
#         room = {
#             'room_name': room_name,
#             'room_group_name': f'pong_{room_name}',
#             'players': {},
#             'game_state': None
#         }
#         self.game_rooms[room_name] = room
#         return room