# Meu Jardim Inteligente

Site PWA para identificar e controlar cuidados de plantas — pronto para GitHub Pages.

## Como publicar
1. Crie repositório no GitHub.
2. Envie os arquivos deste ZIP (index.html, style.css, script.js, manifest.json, service-worker.js e pasta icons).
3. Ative *Settings → Pages → Deploy from a branch → main / (root)*.
4. Acesse: https://<seu-usuario>.github.io/<repo-name>/

## Observações
- Para identificação real por imagem, crie conta em https://web.plant.id/ e cole a chave em `script.js` na constante `API_KEY`.
- As imagens usadas no catálogo são URLs públicas (Unsplash). Substitua por fotos próprias em `/images` se quiser.
