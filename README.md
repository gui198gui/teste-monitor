# Teste de Monitor 🖥️

**Testa o teu monitor no browser, sem instalar nada.**

🔗 **https://gui198gui.github.io/teste-monitor/**

Ferramenta para encontrar píxeis mortos, confirmar se o monitor está mesmo a funcionar aos Hz que pagaste,
ver ghosting, fugas de luz e outros defeitos comuns. Útil quando compras um monitor novo (ainda dentro do
prazo de devolução), quando compras em segunda mão ou quando algo "parece estranho" na imagem.

## Testes

| | Teste | Para que serve |
|---|---|---|
| 🎨 | **Píxeis mortos e presos** | 9 cores sólidas em ecrã inteiro para encontrar píxeis que não acendem ou ficam presos |
| ⚡ | **Reparar píxel preso** | Quadrado arrastável que pisca cores muito depressa sobre o píxel (ou o ecrã todo) |
| 📈 | **Hz reais e frames perdidos** | Mede a taxa de atualização com `requestAnimationFrame`, o tempo por frame, a estabilidade e os frames saltados |
| 🛸 | **Ghosting e motion blur** | Objetos a 240, 480 e 960 px/s em fundo cinzento e escuro, mais um teste de *frame skipping* |
| 🔦 | **Backlight bleed e uniformidade** | Preto e cinzentos (5–75%) para fugas de luz, IPS glow, clouding e dirty screen effect |
| 🌈 | **Gradientes (banding)** | Gradientes cinzentos e RGB, tons escuros e 32 degraus |
| ◐ | **Níveis de preto e branco** | Quadrados de 1 a 20 sobre preto e de 235 a 254 sobre branco, para afinar o brilho e o contraste |
| 🔍 | **Nitidez e escala** | Xadrez e linhas de 1 píxel físico e texto de 8 a 32 px |

A página inicial mostra também a **resolução física**, a **escala do Windows**, a **taxa de atualização**,
a **profundidade de cor** e se o browser deteta **HDR**.

## Controlos

- **Clique**, `Espaço` ou `→`: passo seguinte · `←`: passo anterior
- `H`: mostrar ou esconder as instruções · `Esc`: sair
- No teste de reparar píxel: arrastar o quadrado, `+` e `−` para o tamanho, `F` para piscar o ecrã todo

## Detalhes técnicos

- HTML, CSS e JavaScript, **sem bibliotecas**
- O `canvas` é dimensionado em **píxeis físicos** (`devicePixelRatio`), para os padrões de 1 píxel ficarem
  certos mesmo com a escala do Windows a 125% ou 150%
- A medição de Hz usa a **mediana** dos intervalos entre frames (resistente a picos) e conta como frame perdido
  qualquer intervalo acima de 1,5× a mediana
- Fullscreen API, Pointer Events (arrastar com rato ou toque), PWA com service worker (funciona offline)
- O teste de piscar mostra primeiro um **aviso de fotossensibilidade**

## Correr localmente

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

## Licença

MIT

## Autor

**Guilherme Martins**, estudante de Engenharia Informática no IPCB.
[Portefólio](https://gui198gui.github.io) · [LinkedIn](https://www.linkedin.com/in/guilherme-martins-158279309/) · [GitHub](https://github.com/gui198gui)
