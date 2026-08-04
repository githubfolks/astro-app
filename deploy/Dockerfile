# Receives the signed deploy webhook from CI and runs deploy.sh against the
# host's Docker daemon (via the mounted socket) — see hooks.json and
# docker-compose.vps.yml's `webhook` service.
FROM docker:27-cli

RUN apk add --no-cache bash git docker-cli-compose

ARG WEBHOOK_VERSION=2.8.1
RUN wget -qO- "https://github.com/adnanh/webhook/releases/download/${WEBHOOK_VERSION}/webhook-linux-amd64.tar.gz" \
    | tar xz -C /tmp \
    && mv /tmp/webhook-linux-amd64/webhook /usr/local/bin/webhook \
    && rm -rf /tmp/webhook-linux-amd64

EXPOSE 9001
ENTRYPOINT ["webhook"]
CMD ["-hooks", "/etc/webhook/hooks.json", "-ip", "0.0.0.0", "-port", "9001", "-verbose"]
