# Universe for Us

Uma historinha 3D interativa feita com Three.js: uma personagem fofinha, narrativa com escolhas, um foguete (por dentro!) e uma jornada até as estrelas.

## O que tem aqui

- Cena 3D com Three.js (App Router do Next.js)
- Personagem “fofa” feita de primitivas + animações e expressões
- Fluxo narrativo com balões (texto digitando), escolhas e áudio
- Interior do foguete com mesas/PCs, botão LAUNCH e uma “janela” dinâmica (céu → espaço)
- Página extra `/stars` (tela preta) após a sequência “Olhar estrelas”

## Rodando localmente

Pré-requisitos: Node.js + npm.

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## Estrutura do projeto

- `app/page.tsx`: a experiência 3D + narrativa (quase tudo está aqui)
- `app/layout.tsx`: metadata (título/descrição/ícone)
- `app/stars/page.tsx`: página final (tela preta)
- `public/`: imagens e áudios (ex.: `pc.jpg`, `astronauta.png`, `alert.mp3`, `omaiga.mp3`)

## Dicas

- O botão de mute fica no canto inferior direito.
- Alguns navegadores exigem clique inicial para liberar áudio.

## Stack

- Next.js (App Router) + React + TypeScript
- Three.js
- Tailwind CSS
