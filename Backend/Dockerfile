FROM python:3.12

WORKDIR /backend

COPY Pong/requirements.txt .
COPY script.sh /tmp/setup.sh

RUN chmod +x /tmp/setup.sh

RUN pip install --no-cache-dir -r requirements.txt
# Install Nginx
RUN apt-get update && apt-get install -y nginx openssl
# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY Pong .

# EXPOSE 8000

CMD ["bash", "/tmp/setup.sh"]
