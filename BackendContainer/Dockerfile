FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8
LABEL authors="carter"

COPY ./Backend /app

RUN pip install -r /app/requirements.txt
EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--ssl-keyfile", "/etc/letsencrypt/live/api.genialfeed.com/privkey.pem", "--ssl-certfile", "/etc/letsencrypt/live/api.genialfeed.com/fullchain.pem"]