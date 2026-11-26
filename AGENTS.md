# Contexto do projeto PACA

PACA significa **Plataforma de Apoio à Comunicação Acessível**. É um projeto universitário de comunicação assistiva para pessoas com dificuldades de comunicação. Seu propósito é apoiar a expressão autônoma de necessidades, sentimentos, escolhas, recusas e pedidos de ajuda.

## Funcionalidades previstas

- Cadastro com nome, e-mail e senha; login, logout e recuperação de senha.
- Tela inicial e categorias de comunicação.
- Seleção combinada de símbolos, imagens e palavras.
- Montagem e revisão de mensagens e reprodução por Text-to-Speech quando compatível.
- Frases favoritas, perfil e personalização básica.

## Tecnologias planejadas

- React, TypeScript e Vite.
- Tailwind CSS.
- Supabase para autenticação e banco de dados.
- API de Text-to-Speech do navegador ou dispositivo, quando compatível.
- Git e GitHub para controle de versões.

## Diretrizes

- Priorizar experiência mobile-first, responsiva e acessível.
- Manter a interface simples, com poucos estímulos visuais desnecessários.
- Fazer a montagem e reprodução de mensagens funcionarem localmente sempre que possível.
- Manter a estrutura organizada e fácil de manter.
- Entregar um MVP universitário funcional sem complexidade desnecessária.
- Implementar funcionalidades reais; não tratar telas ilustrativas como conclusão de uma funcionalidade.

## Fora do escopo

- Mapas ou geolocalização.
- Inteligência artificial avançada.
- Reconhecimento de voz ou imagens.
- Diagnóstico ou tratamento.
- Integrações complexas.

## Estado atual

Este repositório contém um protótipo visual e interativo em React, TypeScript, Vite e Tailwind CSS. O cadastro/login é demonstrativo, sem autenticação. Elementos e fotos permanecem no localStorage; preferências de áudio, comunicação e acessibilidade também são locais. Gravações e arquivos de áudio são Blobs armazenados no IndexedDB e vinculados ao identificador do elemento. O perfil opcional, incluindo informações sensíveis, fica apenas no navegador e não é transmitido a serviços externos. SpeechSynthesis em pt-BR é usado como alternativa quando o elemento não tem áudio personalizado e o modo selecionado permite reprodução. Favoritos podem ser mostrados no topo da comunicação sem duplicação; configurações de grade, categorias, tema e acessibilidade afetam a interface. A área de privacidade oferece exclusão confirmada de fotos, áudios e elementos criados. Os pictogramas SVG são originais do projeto e têm informações de autoria em `public/pictograms/README.md`. O Supabase ainda não está conectado.
