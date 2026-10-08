<div align="center">

# 🛣️ Oliveira com Asfalto

### Transparência para quem espera pelo asfalto

> **Quanto falta para o asfalto chegar na minha rua?**

Mapa público e independente para compreender, rua por rua, as obras de pavimentação no Residencial Oliveira, em Campo Grande/MS.

[![Status: MVP](https://img.shields.io/badge/status-MVP-8B5E3C?style=flat-square)](#roadmap)
[![Next.js 16.4](https://img.shields.io/badge/Next.js-16.4-111827?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React 19.3](https://img.shields.io/badge/React-19.3-087EA4?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MapLibre GL JS 6.13](https://img.shields.io/badge/MapLibre_GL_JS-6.13-396CB2?style=flat-square)](https://maplibre.org/)
[![Repositório público](https://img.shields.io/badge/GitHub-repositório_público-2F6B4F?style=flat-square&logo=github)](https://github.com/sergionivo/andamento_do_asfalto)

</div>

---

O Residencial Oliveira convive há anos com ruas sem pavimentação, intervenções parciais e uma longa mobilização comunitária pela conclusão da infraestrutura do bairro. Nesse percurso, moradores organizaram reuniões, ofícios, registros, cobranças públicas e outras formas de participação coletiva.

Em 2026, uma nova contratação passou a contemplar trechos do Residencial Oliveira. Mas projetos de engenharia, plantas, licitações, contratos e atualizações administrativas não respondem com facilidade à pergunta de quem vive no território: **“E a minha rua?”**

O Oliveira com Asfalto nasce para transformar essa complexidade em informação territorial simples e rastreável. O mapa trabalha somente com os trechos identificados nos documentos analisados — ele não presume que toda a área do Oliveira esteja contemplada.

## O que é o Oliveira com Asfalto?

É um projeto independente de transparência territorial e comunitária. A proposta é organizar documentos públicos, projetos, plantas de engenharia, informações administrativas, dados geográficos e evidências de execução em uma experiência compreensível para moradores.

O projeto nasce da mobilização do bairro, mas não é uma ferramenta partidária: não promove candidatos, não faz campanha, não atribui culpa sem evidência e não concede mérito político sem fonte. O acompanhamento deve continuar independentemente de quem esteja no governo.

> [!IMPORTANT]
> O Oliveira com Asfalto é um projeto independente. Não representa a Prefeitura de Campo Grande, a SISEP, a empresa contratada ou a Águas Guariroba.

## A pergunta que guia o produto

> **Quanto falta para o asfalto chegar na minha rua?**

Dizer apenas que “a obra está em andamento” não responde a essa pergunta. Para chegar a uma resposta útil, o produto procura organizar, por trecho:

- se a via está contemplada e qual parte será atendida;
- etapa e andamento disponíveis;
- o que foi executado e o que ainda falta;
- dependências e bloqueios documentados;
- responsável pela ação atual;
- próxima ação e próxima etapa;
- previsão, última atualização, evidência e fonte.

Nem todos esses campos possuem informação pública disponível hoje. Quando a evidência ainda não permite responder, o produto mostra essa lacuna em vez de preenchê-la com suposições.

## O que já conseguimos mapear

| Camada | Estado atual | Origem e método |
| --- | --- | --- |
| 🛣️ **Obra do asfalto** | **14 eixos técnicos validados** | Vias e trechos identificados no Projeto Executivo. Geometria cartográfica baseada no OpenStreetMap e validada manualmente contra as plantas do projeto. |
| 🌧️ **Drenagem da chuva** | **22 trechos e 24 nós/PVs** | Geometria construída a partir das coordenadas do Projeto Executivo e conferida manualmente contra as pranchas técnicas. |
| 💧 **Rede de água** | **30 segmentos em 27 corredores** | Referência baseada no cadastro de 2025 da Águas Guariroba, incorporado ao Projeto Executivo, e representada sobre corredores do OpenStreetMap. |
| 🚰 **Rede de esgoto** | **25 segmentos em 24 corredores** | Referência baseada no cadastro de 2025 da Águas Guariroba, com representação cartográfica referencial. |

A geometria de pavimentação derivada do OpenStreetMap é uma base cartográfica validada contra o projeto; ela **não** é uma geometria oficial fornecida pela Prefeitura.

> [!NOTE]
> As redes de água e esgoto são representadas como corredores de referência. As linhas não indicam a posição subterrânea exata das tubulações.

Presença de rede não significa interferência confirmada. Interferência, por sua vez, não significa bloqueio. O projeto não atribui automaticamente atraso ou responsabilidade à Águas Guariroba apenas porque existe uma rede cadastrada no corredor.

## Estar no mapa não significa estar executado

Um trecho aparecer no mapa significa que há evidência de que ele pertence ao escopo, ao projeto ou ao cadastro técnico correspondente. Isso não significa automaticamente:

- obra iniciada;
- drenagem executada;
- base pronta;
- asfalto aplicado;
- rua liberada;
- inexistência de bloqueio;
- previsão de conclusão.

**Geometria validada não é execução confirmada.** Para afirmar andamento real, o projeto exige evidência temporal.

> [!WARNING]
> O Oliveira com Asfalto nunca transforma ausência de informação em conclusão, atraso ou responsabilidade atribuída.

## Estado operacional atual

A estrutura para acompanhar a execução por trecho já existe no código, mas a fonte versionada de eventos operacionais — [`src/data/operational-events.ts`](src/data/operational-events.ts) — está intencionalmente vazia.

Por isso, a aplicação prefere mostrar **“Sem atualização pública”**, **“Sem previsão divulgada”** ou **“Informação não divulgada”** a inventar uma etapa. Esses textos não representam falha do sistema: tornam visível aquilo que ainda não pode ser afirmado com segurança.

## Como classificamos as informações

| Classificação | Significado |
| --- | --- |
| **Informação oficial** | Documento ou publicação de órgão ou entidade responsável. |
| **Estimativa do projeto** | Inferência do Oliveira com Asfalto baseada nos dados disponíveis. |
| **Observação de campo** | Registro presencial, datado e localizado. |
| **Registro da comunidade** | Foto, relato ou material fornecido ou publicado por moradores. |

Uma categoria nunca deve ser apresentada como outra. Em especial, registro comunitário não se torna informação oficial automaticamente.

## Princípios do projeto

- **Transparência acima da aparência.**
- Nunca inventar datas ou status.
- Toda informação relevante precisa de fonte e data.
- Separar fato, hipótese, estimativa e observação.
- Não atribuir atraso ou responsabilidade sem evidência.
- Trabalhar por trecho quando a realidade da obra exigir.
- “Sem informação” é uma resposta válida.
- Estimativa não é promessa oficial.
- Registro comunitário não é dado oficial automaticamente.
- Usar linguagem simples sem destruir a precisão técnica.

## Contratação acompanhada

O código e os datasets versionados identificam a seguinte referência documental:

| Campo | Informação confirmada no repositório |
| --- | --- |
| Licitação | Concorrência Eletrônica nº 006/2026 |
| Lote | Lote 22 |
| Documentos usados pela aplicação | Projeto Executivo de pavimentação e pranchas técnicas de drenagem e saneamento |

Identificadores de PNCP, contrato, processo, item, contratada e órgão responsável não foram incluídos nesta versão do README porque não estão registrados em uma fonte documental versionada no repositório. Eles devem ser acrescentados quando puderem ser acompanhados da respectiva referência primária.

> [!IMPORTANT]
> O Lote 22 abrange outros bairros além do Residencial Oliveira. Valores e prazos globais do contrato não devem ser apresentados como exclusivos do Oliveira.

## Obras anteriores não são misturadas com a contratação atual

O bairro recebeu intervenções anteriores, inclusive no período de 2022–2023. O Oliveira com Asfalto acompanha a contratação de 2026 de forma separada.

Informações antigas não são usadas automaticamente para definir estágio, percentual, bloqueios, responsabilidades ou execução da nova contratação. Essa separação evita que ações de momentos e escopos diferentes produzam uma leitura enganosa do presente.

## Como funciona

1. Abra o mapa.
2. Encontre sua rua.
3. Toque no trecho destacado.
4. Veja se ele está previsto na obra.
5. Consulte o andamento que possui evidência disponível.
6. Ative as camadas para entender drenagem, água e esgoto.
7. Consulte as fontes e evidências apresentadas.

📍 **Onde estou:** quando solicitado pelo usuário, o navegador usa a localização para posicionar o mapa.

## Privacidade

A localização:

- só é solicitada depois da ação do usuário;
- é usada para posicionar o mapa e exibir um marcador;
- permanece apenas na memória do frontend;
- não é persistida em `localStorage`, `sessionStorage` ou banco de dados;
- não é enviada ao servidor;
- não é enviada para as ferramentas de métricas.

Google Analytics 4 e Microsoft Clarity só são carregados em produção depois de autorização explícita. A preferência (`granted` ou `denied`) é a única informação guardada localmente para essa finalidade e pode ser alterada em **Mais → Privacidade e métricas**. Relatos, contatos, fotos, textos digitados e coordenadas não são enviados a essas ferramentas. A implementação e o procedimento de validação estão documentados em [`docs/analytics.md`](docs/analytics.md).

Navegadores exigem contexto seguro para geolocalização. Em produção, isso significa HTTPS; `localhost` é normalmente aceito durante o desenvolvimento, mas um endereço IP local servido por HTTP pode não ter acesso ao recurso.

## Stack

| Tecnologia | Uso no projeto |
| --- | --- |
| [Next.js 16.4](https://nextjs.org/) | Aplicação web com App Router e renderização da home. |
| [React 19.3](https://react.dev/) | Componentes e estado da interface. |
| [TypeScript 5](https://www.typescriptlang.org/) | Tipagem da aplicação, dos eventos e dos dados geográficos. |
| [Tailwind CSS 4](https://tailwindcss.com/) | Sistema visual e interface responsiva. |
| [MapLibre GL JS 6.13](https://maplibre.org/) | Mapa interativo, camadas e controles cartográficos. |
| [proj4](https://proj4js.org/) | Transformação das coordenadas técnicas de drenagem. |
| [OpenStreetMap](https://www.openstreetmap.org/) | Mapa-base e corredores cartográficos utilizados quando aplicável. |

O MVP mantém seus dados versionados no próprio repositório. A home não depende de banco de dados, autenticação ou API governamental para o funcionamento básico; os tiles do mapa-base dependem de conexão com a internet.

## Modelo de dados

```text
OBRA
 └── RUA
      └── TRECHO
           ├── ETAPA
           ├── STATUS
           ├── RESPONSÁVEL
           ├── DEPENDÊNCIA / BLOQUEIO
           ├── PRÓXIMA AÇÃO
           ├── PREVISÃO
           ├── EVIDÊNCIA
           ├── FONTE
           └── DATA
```

Nem todos os campos possuem informação pública disponível neste momento. O modelo permite acrescentá-los sem confundir o desenho territorial com a confirmação da execução.

### Status operacionais previstos no código

- Não iniciada
- Prevista
- Em preparação
- Em execução
- Aguardando
- Obra bloqueada
- Liberada para próxima etapa
- Concluída
- Sem atualização pública

Um status só deve aparecer como situação real quando houver evento ou evidência que o sustente.

## Fontes prioritárias

O projeto prioriza fontes primárias e documentos rastreáveis, como:

- Prefeitura de Campo Grande e SISEP;
- Portal da Transparência, Diogrande e PNCP;
- processos de licitação, contratos e aditivos;
- Projeto Executivo, Memorial Descritivo, planilhas orçamentárias e cronogramas;
- Ordens de Serviço, boletins de medição e relatórios de fiscalização;
- Águas Guariroba;
- respostas obtidas por LAI/SIC.

## O que ainda estamos buscando

A próxima grande evolução depende de documentos operacionais que permitam registrar o andamento real de cada trecho, entre eles:

- contrato integral e anexos, quando aplicável;
- Ordem de Serviço ou Ordem de Execução;
- designação de gestor e fiscais;
- boletins, memórias e planilhas de medição;
- relatórios de fiscalização e diários de obra;
- registros de sondagens de interferência;
- comunicações formais sobre redes;
- aditivos e reprogramações.

Quando determinada informação não está publicada, o projeto pode recorrer aos canais oficiais da Lei de Acesso à Informação. Nome, CPF, protocolo pessoal e outros dados do solicitante não devem ser publicados.

## Um projeto que nasce do bairro

Moradores vêm se mobilizando há anos por meio de reuniões, ofícios, fotografias, publicações, registros e cobranças por infraestrutura. Para quem vive em ruas ainda sem pavimentação, a poeira durante a seca e a lama durante as chuvas não são abstrações: fazem parte da rotina.

O Oliveira com Asfalto representa uma evolução dessa mobilização: da cobrança isolada para a organização pública, territorial e verificável da informação. O objetivo não é substituir a participação comunitária, mas dar a ela uma base que possa ser consultada, conferida e corrigida.

## Acompanhe a comunidade

No Instagram, [@oliveiracomasfalto](https://www.instagram.com/oliveiracomasfalto/) reúne registros da mobilização e atualizações comunitárias.

Publicações comunitárias podem ajudar a documentar o território, mas não são classificadas automaticamente como informação oficial.

Ao selecionar uma rua no mapa, o morador pode enviar uma observação e até quatro fotos para análise. A contribuição chega pelo Netlify Forms e passa por moderação: nada altera automaticamente o status oficial, a etapa da obra ou a timeline pública. Somente registros aprovados e adicionados manualmente ao repositório aparecem como **Registro da comunidade**. Os critérios estão em [`docs/community-moderation.md`](docs/community-moderation.md).

## Quer contribuir?

Contribuições são bem-vindas, especialmente:

- correções e melhorias de UX;
- documentação e referências;
- dados públicos e fontes primárias;
- registros verificáveis;
- melhorias técnicas e de acessibilidade.

Encontrou um erro ou tem uma sugestão? [Abra uma Issue](https://github.com/sergionivo/andamento_do_asfalto/issues) descrevendo o problema, a proposta e, quando possível, a fonte usada.

## Rodando localmente

### Requisitos

- Node.js **20.9 ou superior**
- npm
- conexão com a internet para carregar o mapa-base

```bash
git clone https://github.com/sergionivo/andamento_do_asfalto.git
cd andamento_do_asfalto
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

O Next.js também informa um endereço `Network` para testes em outros dispositivos da mesma rede. A aplicação pode abrir por esse endereço, mas a geolocalização normalmente não funciona via IP local em HTTP porque o navegador exige HTTPS fora de `localhost`.

### URL pública e prévia de compartilhamento

A metadata usa `NEXT_PUBLIC_SITE_URL` quando a variável está disponível e recorre a `https://oliveiracomasfalto.netlify.app` como endereço canônico. WhatsApp e outros serviços da Meta podem manter a prévia dos links em cache; por isso, alterações no título, na descrição ou em `public/og-image.png` podem levar algum tempo para aparecer mesmo após um deploy bem-sucedido.

## Scripts do projeto

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Gera a build de produção. |
| `npm run start` | Inicia a aplicação a partir de uma build. |
| `npm run lint` | Executa o ESLint. |
| `npm run typecheck` | Verifica os tipos sem gerar arquivos. |
| `npm test` | Executa os testes automatizados com o test runner do Node.js. |
| `npm run data:validate` | Confere o cadastro dos 14 eixos e a extensão oficial total esperada. |
| `npm run osm:fetch` | Consulta a Overpass API e atualiza os candidatos OSM das vias de pavimentação. |
| `npm run osm:fetch-sanitation` | Consulta a Overpass API e atualiza os corredores candidatos de saneamento. |
| `npm run sanitation:migrate-segments` | Migra os datasets de saneamento para o modelo de múltiplos segmentos sem recalcular coordenadas. |
| `npm run sanitation:freeze` | Normaliza e congela metadados canônicos de água e esgoto. |
| `npm run drainage:generate` | Regenera o GeoJSON de drenagem a partir das coordenadas técnicas versionadas. |

## Ferramentas internas de validação

O repositório contém três interfaces de apoio cartográfico:

### `/dev/geometria`

Permite revisar os eixos de pavimentação contra os corredores candidatos do OpenStreetMap, selecionar múltiplos `ways`, usar geometrias completas ou recortadas e validar a integridade do resultado.

### `/dev/drenagem`

Exibe a drenagem derivada das coordenadas do Projeto Executivo para conferência contra a pavimentação e as pranchas técnicas.

### `/dev/saneamento`

Permite revisar e validar os corredores de referência das redes de água e esgoto, inclusive múltiplos segmentos por corredor.

> [!CAUTION]
> Essas interfaces são ferramentas internas, não funcionalidades destinadas aos moradores. As páginas `/dev` existem nas rotas da aplicação e atualmente não possuem autenticação ou controle de acesso próprio. As APIs que gravam validações retornam indisponíveis fora de `NODE_ENV=development`, mas isso não equivale a proteger as páginas. Avalie sua exposição antes de qualquer publicação.

## Dados canônicos

```text
src/data/generated/
├── paving-segments.validated.geojson
├── drainage.project.validated.geojson
├── water-network.reference.validated.geojson
└── sewer-network.reference.validated.geojson
```

Esses quatro arquivos são as fontes cartográficas canônicas consumidas diretamente pela home atual:

- `paving-segments.validated.geojson`: 14 geometrias de eixos de pavimentação, baseadas no OSM e validadas manualmente contra o Projeto Executivo;
- `drainage.project.validated.geojson`: 22 trechos e 24 nós derivados das coordenadas técnicas do projeto;
- `water-network.reference.validated.geojson`: 30 segmentos referenciais de água;
- `sewer-network.reference.validated.geojson`: 25 segmentos referenciais de esgoto.

Arquivos com `.mock` ainda existentes em `src/data/` pertencem à fase inicial e a testes/legado. Eles não alimentam a home pública atual.

## Transparência metodológica

Documentos de engenharia e geometrias cartográficas podem produzir medidas próximas, mas não idênticas. Quando há, por exemplo, um comprimento oficial e outro calculado sobre uma linha do OpenStreetMap, o produto preserva a medida oficial como referência técnica e mantém a geometria cartográfica como ela foi validada.

O projeto não estica, encurta ou cria conectores artificiais apenas para fazer os números coincidirem. Diferenças são registradas e comparadas — não escondidas.

## Créditos cartográficos

Mapa-base e parte dos corredores cartográficos: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright), sob os termos aplicáveis da ODbL.

Quando utilizado, o OpenStreetMap funciona como base cartográfica aberta. Ele não é apresentado como fonte oficial da Prefeitura. As geometrias de pavimentação e os corredores referenciais foram confrontados manualmente com os documentos técnicos correspondentes; a drenagem foi gerada a partir das coordenadas do Projeto Executivo.

## Roadmap

### Base cartográfica e produto atual

- [x] Identificação da contratação acompanhada
- [x] Levantamento documental inicial
- [x] Mapeamento dos trechos de asfalto
- [x] Mapeamento da drenagem
- [x] Referência cartográfica de água
- [x] Referência cartográfica de esgoto
- [x] Interface mobile-first
- [x] Geolocalização opcional
- [x] Métricas de produto com consentimento prévio

### Transparência operacional

- [ ] Obter boletins de medição
- [ ] Obter relatórios de fiscalização
- [ ] Alimentar o andamento por trecho
- [ ] Construir o histórico temporal das ruas
- [ ] Registrar bloqueios somente com evidência

### Comunidade

- [ ] Organizar a história da pavimentação
- [ ] Estruturar sugestões e correções
- [x] Estruturar envio e publicação moderada de registros da comunidade
- [ ] Melhorar a integração com atualizações públicas

### Produto

- [ ] Disponibilizar um deploy público
- [x] Integrar analytics com consentimento e minimização de dados
- [ ] Criar onboarding para novos visitantes
- [ ] Definir uma rotina pública de atualização

## Possibilidade de reuso

O repositório ainda não é um framework genérico, mas sua metodologia pode inspirar iniciativas semelhantes em outros bairros e cidades: transformar **obra → rua → trecho → etapa → evidência** em informação territorial compreensível e auditável.

---

<div align="center">

**No fim, o objetivo é simples: permitir que qualquer morador saiba o que está acontecendo na sua rua — e de onde veio essa informação.**

</div>
