build:
	mkdir -p ~/data/frontend
	mkdir -p ~/data/backend
	mkdir -p ~/data/postgres
	docker compose up --build -d

stop:
	docker compose stop

start:
	docker compose start

down:
	docker compose down -v

clean: down
	sudo rm -rf ~/data
	docker system prune -af

re: down build
