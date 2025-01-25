CERT_DIR := ./cert

build:
	@mkdir -p $(CERT_DIR)
	@openssl req -x509 -nodes -newkey rsa:2048 -keyout $(CERT_DIR)/ssl_cert.key \
 		-out $(CERT_DIR)/ssl_cert.crt -subj "/CN=localhost"
	docker compose up --build -d

stop:
	docker compose stop

start:
	docker compose start

down:
	@rm -rf $(CERT_DIR)
	docker compose down -v

clean: down
	docker system prune -af

re: clean build
