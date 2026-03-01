#!/bin/bash
# Ouvrir les ports 80 et 443 pour HTTPS/SSL
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw status
