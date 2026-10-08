# Métricas, consentimento e privacidade

O Oliveira com Asfalto usa Google Analytics 4 e Microsoft Clarity somente na home pública, em produção e depois de uma autorização explícita. Sem autorização, os scripts não são baixados e nenhum evento é enviado.

## Configuração

Defina no ambiente de produção:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-H42F8HTE3E
NEXT_PUBLIC_CLARITY_PROJECT_ID=yuidv1ivz4
```

Se uma variável estiver ausente, a integração correspondente permanece inativa. Em desenvolvimento (`npm run dev`), ambas permanecem inativas mesmo que existam variáveis locais.

## Consentimento

A preferência fica apenas em `localStorage`, na chave `oliveira_analytics_consent`, com um dos valores:

- `granted`: permite carregar as ferramentas e registrar eventos futuros;
- `denied`: não carrega as ferramentas.

O usuário pode rever a decisão em **Mais → Privacidade e métricas**. Ao desativar, novos eventos deixam de ser emitidos imediatamente; o Consent Mode do GA é atualizado e o Clarity recebe a revogação e a limpeza de seus cookies quando já estava carregado.

## Eventos permitidos

Toda instrumentação passa por `trackEvent()` em `src/lib/analytics.ts`. Os parâmetros aceitos são limitados por tipo a identificadores técnicos do trecho, nome de camada, método de compartilhamento e categorias de origem/erro.

Nunca enviar:

- coordenadas ou localização do usuário;
- texto de relatos ou contatos;
- nomes, telefones ou e-mails;
- fotos, nomes de arquivos ou conteúdo digitado;
- identificadores de usuário.

O formulário comunitário também usa `data-clarity-mask="true"` nas áreas de relato, contato e upload. O Clarity mascara campos de entrada por padrão, e a marcação explícita reforça a proteção desses blocos.

## Rotas

Page views e eventos são aceitos apenas na experiência pública. Rotas `/dev/*` e `/api/*` são excluídas. A integração usa `next/script` com `afterInteractive`, sempre condicionada a produção, configuração e consentimento.

## Validação em produção

1. Abra o site em janela privada e confirme que não há requisições para Google Analytics ou Clarity antes de escolher.
2. Escolha **Continuar sem métricas** e confirme que as requisições continuam ausentes.
3. Em **Mais → Privacidade e métricas**, permita métricas.
4. Confirme no DevTools o carregamento de `googletagmanager.com/gtag/js` e `clarity.ms/tag`.
5. Use o DebugView do GA4 e o painel do Clarity para validar eventos sem dados pessoais.
6. Desative novamente e confirme que novos eventos deixam de ser enviados.

Os IDs públicos ficam centralizados nas variáveis de ambiente; nunca devem ser repetidos nos componentes.
