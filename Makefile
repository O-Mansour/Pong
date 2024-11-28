build:
	docker compose up --build -d

stop:
	docker compose stop

start:
	docker compose start

down:
	docker compose down -v

clean: down
	docker system prune -af

re: clean build
