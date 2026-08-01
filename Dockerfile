# CompetencyMentor AI — image tout-en-un pour la démo
# (backend Express + Bloc 1 Python en sous-processus + frontend React buildé et servi statiquement)

FROM node:18-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:18-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Bloc 1 (ML) : venv Python dédié
COPY bloc1_ml/requirements.txt ./bloc1_ml/requirements.txt
RUN python3 -m venv /app/bloc1_ml/venv \
    && /app/bloc1_ml/venv/bin/pip install --no-cache-dir -r bloc1_ml/requirements.txt
COPY bloc1_ml/*.py ./bloc1_ml/
COPY bloc1_ml/*.joblib ./bloc1_ml/
COPY bloc1_ml/*.csv ./bloc1_ml/

# Bloc 2 (Agent LLM)
COPY bloc2_agent/*.js ./bloc2_agent/

# Backend (API)
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# Frontend déjà buildé, servi statiquement par le backend
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

ENV PYTHON_BIN=/app/bloc1_ml/venv/bin/python3
ENV PORT=4000
EXPOSE 4000

CMD ["node", "server.js"]
