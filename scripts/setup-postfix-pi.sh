#!/bin/bash
# ============================================================
# Setup Postfix on Raspberry Pi for VetApp email (localhost:587)
# Creates vetapp@gatoescondido.com sending capability
# ============================================================

set -e

DOMAIN="gatoescondido.com"
FROM_ADDR="vetapp@gatoescondido.com"
HOSTNAME="vet-server"

echo "=== 1. Set hostname ==="
sudo hostnamectl set-hostname "$HOSTNAME"
echo "$HOSTNAME" | sudo tee /etc/hostname

echo "=== 2. Install Postfix + dependencies ==="
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postfix mailutils libsasl2-modules

echo "=== 3. Configure Postfix for submission (port 587) ==="
sudo postconf -e "myhostname = $HOSTNAME.$DOMAIN"
sudo postconf -e "mydomain = $DOMAIN"
sudo postconf -e "myorigin = \$mydomain"
sudo postconf -e "inet_interfaces = 127.0.0.1, 192.168.1.174"
sudo postconf -e "mydestination = \$myhostname, localhost.\$mydomain, localhost"
sudo postconf -e "relayhost ="
sudo postconf -e "smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, defer_unauth_destination"
sudo postconf -e "mynetworks = 127.0.0.0/8, 192.168.1.0/24"
sudo postconf -e "home_mailbox = Maildir/"
sudo postconf -e "smtpd_sasl_auth_enable = yes"
sudo postconf -e "smtpd_sasl_type = dovecot"
sudo postconf -e "smtpd_sasl_path = private/auth"
sudo postconf -e "smtpd_use_tls = yes"
sudo postconf -e "smtp_use_tls = yes"
sudo postconf -e "smtp_tls_security_level = may"
sudo postconf -e "smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem"
sudo postconf -e "smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key"

echo "=== 4. Enable submission port in master.cf ==="
sudo sed -i 's/^#submission/submission/' /etc/postfix/master.cf
sudo sed -i '/^submission/s/-o syslog_name=postfix\/submission/-o syslog_name=postfix\/submission\n  -o smtpd_sasl_auth_enable=yes\n  -o smtpd_relay_restrictions=permit_sasl_authenticated,reject/' /etc/postfix/master.cf

echo "=== 5. Create email alias for vetapp ==="
echo "vetapp@gatoescondido.com: marco.candido@gmail.com" | sudo tee -a /etc/aliases
sudo newaliases

echo "=== 6. Create user for SMTP auth ==="
sudo useradd -m -s /bin/bash vetapp 2>/dev/null || true
echo "vetapp:$(openssl rand -base64 12)" | sudo chpasswd

echo "=== 7. Restart Postfix ==="
sudo systemctl restart postfix
sudo systemctl enable postfix

echo "=== 8. Test local delivery ==="
echo "Teste de email do servidor Postfix no Raspberry Pi" | mail -s "Teste Postfix Pi" marco.candido@gmail.com

echo ""
echo "=== DONE ==="
echo "Postfix running on 192.168.1.174:587"
echo "SMTP_USER: vetapp@gatoescondido.com"
echo "SMTP_PASS: <vetapp user password>"
echo ""
echo "For outbound delivery to the internet, install msmtp as relay:"
echo "  sudo apt-get install -y msmtp msmtp-mua"
echo "  Configure ~/.msmtprc with your email provider SMTP"
echo ""
echo "Or configure Postfix to relay through your email host:"
echo "  sudo postconf -e 'relayhost = [smtp.gmail.com]:587'"
echo "  sudo postconf -e 'smtp_sasl_auth_enable = yes'"
echo "  sudo postconf -e 'smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd'"
echo "  sudo postconf -e 'smtp_sasl_security_options = noanonymous'"
echo "  echo '[smtp.gmail.com]:587 your@email.com:yourpassword' | sudo tee /etc/postfix/sasl_passwd"
echo "  sudo postmap /etc/postfix/sasl_passwd"
