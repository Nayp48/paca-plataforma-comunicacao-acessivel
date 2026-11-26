# PACA

Plataforma de Apoio à Comunicação Acessível: um projeto universitário de comunicação assistiva.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm

## Instalação

Na raiz do repositório, instale as dependências:

```bash
npm install
```

## Desenvolvimento

Inicie o servidor local:

```bash
npm run dev
```

O Vite exibirá o endereço local no terminal.

## Verificações

```bash
npm run typecheck
npm test
npm run build
```

`typecheck` valida os tipos TypeScript sem emitir arquivos. `npm test` executa os testes da lógica de áudio e da organização de favoritos. `build` gera a versão de produção em `dist/`.

## Tecnologias

- React e TypeScript
- Vite
- Tailwind CSS

## Protótipo atual

A interface inclui apresentação e acesso demonstrativo (sem autenticação), categorias de comunicação, favoritos, edição de elementos e composição de mensagens. Favoritos podem aparecer também no topo da comunicação, sem duplicação na grade, e as preferências permitem reorganizar as categorias.

Configurações de áudio, comunicação e acessibilidade persistem no `localStorage`. O perfil, inclusive campos opcionais sensíveis, é privado neste navegador e não é enviado a serviços externos. Elementos e fotos continuam na chave local `paca.communication.elements.v1`; áudios personalizados são Blobs no IndexedDB (`paca-local-media`). A área de Privacidade permite apagar imagens, áudios ou elementos criados após confirmação. O modo de alto contraste, tema, tamanho de texto, espaçamento, movimento e estímulos visuais afetam a interface.

Os quatro modos de áudio são preservados. Velocidade e volume da voz automática e volume de áudio personalizado são ajustáveis quando o navegador/dispositivo oferece suporte. A voz de prévia usa SpeechSynthesis em pt-BR. Os pictogramas locais são desenhos originais do projeto; veja `public/pictograms/README.md`. O Supabase ainda não está conectado.
