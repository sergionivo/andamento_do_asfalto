# Oliveira com Asfalto

## Geolocalização no desenvolvimento

A geolocalização do navegador exige um contexto seguro em produção (`HTTPS`). Em desenvolvimento, `localhost` é aceito pelos navegadores. A posição é mantida somente na memória do frontend: não é salva, enviada ao servidor nem registrada em analytics.

MVP mobile-first para visualizar, de forma simples, a situação de obras de pavimentação no Residencial Oliveira I e II, em Campo Grande/MS.

## Executar localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Verificações

```bash
npm run typecheck
npm run lint
npm run build
npm run data:validate
```

## Revisão cartográfica

A rota de desenvolvimento [http://localhost:3000/dev/geometria](http://localhost:3000/dev/geometria) permite montar e validar manualmente os 14 eixos usando geometrias candidatas do OpenStreetMap. Ela não faz parte da interface pública e não apresenta uma geometria em edição como oficial.

Fluxo de validação:

1. escolha um eixo;
2. adicione um ou mais `ways` candidatos;
3. use os pontos A/B para recortar a linha quando necessário;
4. registre as referências de início e fim;
5. confira as extensões e confirme manualmente.

Durante `npm run dev`, a confirmação usa `/api/dev/geometry-validation` para gravar `src/data/generated/paving-segments.validated.geojson`. O endpoint responde como inexistente fora do ambiente de desenvolvimento. A home não consome esse arquivo.

Para atualizar o arquivo local de candidatos:

```bash
npm run osm:fetch
```

O script consulta a Overpass API durante o desenvolvimento e grava `src/data/generated/osm-street-candidates.geojson`. Nenhuma consulta é feita pelo navegador do usuário final.

## Dados desta versão

Todos os segmentos, nomes de vias e estados de andamento são **MOCK**, criados somente para testar a experiência. Eles não representam ruas contempladas, medições ou informações oficiais da obra.

- A geometria demonstrativa fica em `src/data/paving-segments.mock.geojson`.
- O andamento demonstrativo fica separado em `src/data/paving-progress.mock.ts`.
- A aparência e os textos de cada status ficam centralizados em `src/config/statuses.ts`.
- O cadastro sem geometria dos 14 eixos oficiais fica em `src/data/paving-segments.official.ts`.
- Aliases de nomes de ruas ficam em `src/data/street-aliases.ts`.

O mapa-base usa OpenStreetMap e depende de conexão com a internet para carregar os tiles.

O arquivo `public/maplibre-gl-worker.mjs` é o worker oficial distribuído pelo MapLibre 6.13.0. Ele é servido localmente porque o Turbopack não resolve automaticamente a URL desse worker no modo de desenvolvimento.
