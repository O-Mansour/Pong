FROM python:3.12

WORKDIR /backend

COPY Pong/requirements.txt .
COPY script.sh /tmp/setup.sh

RUN pip install --no-cache-dir -r requirements.txt

COPY Pong .

EXPOSE 8000

CMD ["bash", "/tmp/setup.sh"]
