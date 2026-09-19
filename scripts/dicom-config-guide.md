# Guia de Configuracao DICOM - Examion X-AQS

## Onde encontrar as configuracoes DICOM no X-AQS

### 1. Abrir X-AQS no PC do raio X ou PC da clinica
- O software X-AQS deve estar instalado em pelo menos um PC
- Inicia sessao como administrador/tecnico (nao como veterinario normal)

### 2. Menu: Configuracao / Einstellungen / Settings
- Procura o icone de engrenagem ou menu "System"
- Navega ate: `Rede / Network` ou `DICOM / PACS`

### 3. Configuracoes a verificar e anotar:

#### A) DICOM Server (o proprio RX / X-AQS)
```
AE Title do RX:  _______________ (ex: EXAMION, XAQS, DR_RX1)
Porta DICOM:     _______________ (ex: 104, 11112, 4242)
IP do RX:        _______________ (192.168.0.78)
```

#### B) Worklist / Modality Worklist (MWL)
```
AE Title Worklist: _______________ (ex: XAQS_MWL)
Porta Worklist:    _______________ (ex: 104, 11112)
```

#### C) DICOM Storage (para receber imagens)
```
AE Title Storage:  _______________ (ex: XAQS_SCP)
Porta Storage:     _______________ (ex: 104, 11112)
```

### 4. Configurar o RX para aceitar VetConnect

No menu DICOM -> "Remote Nodes" ou "Called AE Titles":

Adiciona uma entrada nova:
```
Remote AE Title:   VETCONNECT
Remote IP:         192.168.0.166  (IP do Raspberry Pi / servidor VetConnect)
Remote Port:       11112          (porta onde VetConnect recebe imagens)
```

Se nao souberes o IP do Raspberry Pi:
- Abre terminal/cmd no Raspberry Pi
- Corre: `ip addr show` ou `ifconfig`
- Procura o IP em `eth0` ou `wlan0` (provavelmente 192.168.0.xxx)

### 5. Configurar Worklist no RX

Para que o RX mostre os pedidos do VetConnect no ecra:

No X-AQS, procura: `Worklist Configuration` ou `Modality Worklist`

Configura:
```
Worklist Provider AE Title: VETCONNECT
Worklist Provider IP:         192.168.0.166
Worklist Provider Port:     11112
```

### 6. Configurar Storage Commitment / Push

Para que o RX envie as imagens para o VetConnect depois de tirar:

No X-AQS, procura: `DICOM Send` ou `Storage Destination`

Adiciona:
```
Destination AE Title: VETCONNECT
Destination IP:       192.168.0.166
Destination Port:     11112
Tipo:                 C-STORE (Storage SCU)
```

### 7. Firewall / Rede

Se o RX tiver firewall integrado:
- Adiciona regra para aceitar ligacoes do IP 192.168.0.166
- Portas: 104, 11112 (TCP)

Se houver um router/firewall entre o RX e o Raspberry Pi:
- Verifica se nao ha isolamento de VLANs
- Os dois dispositivos devem estar na mesma rede 192.168.0.x

## Valores comuns Examion X-AQS

Baseado na documentacao do fabricante, os defaults sao geralmente:
- AE Title: `XAQS`, `EXAMION`, `DRS`
- Porta: `104` (DICOM standard) ou `11112` (DICOM secondary)
- Worklist: integrado no proprio X-AQS (nao precisa de servidor externo)

## Depois de configurar

1. Corre o script `dicom-diagnose.ps1` novamente no PC da clinica
2. Tenta fazer um pedido de raio X no VetConnect
3. Verifica se aparece na worklist do RX
4. Tira uma radiografia e verifica se chega ao VetConnect

## Suporte Examion

Se tiveres dificuldades:
- Telefone: +49 711 120 002 - 0
- Email: vertrieb@examion.com
- Service Hotline: Seg-Sex 8h-17h

## Informacao para nos

Por favor copia e cola aqui as configuracoes que encontraste:
```
AE Title RX: 
Porta RX: 
IP RX: 
AE Title Worklist:
Porta Worklist:
AE Title Storage:
Porta Storage:
```
