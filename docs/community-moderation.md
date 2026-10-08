# Moderação de registros da comunidade

Os envios chegam ao formulário `community-update` no Netlify. Eles não alteram o mapa, o andamento oficial nem qualquer arquivo do repositório. “Revisado” significa apenas que o conteúdo passou por moderação; não o transforma em informação oficial.

## Fluxo de publicação

1. Abra a submissão no painel do Netlify e confira trecho, data, relato e fotos.
2. Verifique se o registro é coerente e relacionado ao eixo indicado.
3. Remova dados privados. Nome, contato, IP e outros metadados da submissão nunca entram em `community-events.ts`.
4. Recorte, remova ou rejeite imagens com rostos, placas, documentos ou dados pessoais. Remova EXIF quando possível.
5. Copie somente o conteúdo público aprovado e neutralizado.
6. Salve imagens aprovadas em `public/community/TXX/`, sem nomes de moradores.
7. Crie um `CommunityEvent` em `src/data/community-events.ts`.
8. Rode `npm run data:validate`, `npm test`, `npm run lint`, `npm run typecheck` e `npm run build`.
9. Faça commit e push; o deploy então publica o registro.

## Critérios

### Aprovar

- trecho identificável e data plausível;
- relato coerente com a observação;
- foto útil para sustentar o registro, quando enviada;
- ausência de dados pessoais problemáticos, ataques e acusações sem evidência.

### Ajustar

- neutralize classificações ou conclusões exageradas;
- corrija apenas clareza e privacidade, sem mudar o sentido do relato;
- recorte ou remova fotos inadequadas;
- para `apparently_stopped`, use linguagem como “Sem atividade visível no momento do registro”, nunca “obra paralisada”.

### Rejeitar

- sem relação verificável com o trecho;
- spam, propaganda política, ataque pessoal ou acusação sem evidência;
- imagem inadequada ou exposição de dados pessoais;
- duplicação sem informação adicional.

## Publicação segura

O identificador deve seguir `community-TXX-AAAA-MM-DD-NN`. As datas `observedAt`, `reviewedAt` e `publishedAt` têm significados distintos. Todo registro publicado usa `classification: "community_report"`, `reviewStatus: "reviewed"` e `sourceLabel: "Registro da comunidade"`.

As imagens devem usar `/community/TXX/arquivo.jpg|png|webp`. O validador rejeita travessia de diretório, e o componente público não renderiza HTML fornecido pelo morador.

