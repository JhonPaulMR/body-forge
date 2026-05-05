# Roteiro de Vídeo Detalhado - Checkpoint do App Body Forge (10 Minutos)

Este roteiro foi expandido para cobrir em detalhes cada aspecto do código, arquitetura e fluxo de trabalho, ideal para uma apresentação aprofundada de **aproximadamente 10 minutos** (estimativa de ~1200 a 1400 palavras).

---

### Bloco 1: Introdução e Contexto do Projeto (0:00 - 1:30)

**[Visual]**
*   Comece com a câmera aberta em você (se for exigido/desejado) ou diretamente na tela inicial do seu repositório no GitHub.
*   Em seguida, abra o arquivo `README.md` renderizado no repositório, rolando lentamente para mostrar a proposta do app.

**[Áudio / O que falar]**
> "Olá a todos, meu nome é [Seu Nome], e este é o vídeo de apresentação do segundo checkpoint do projeto da disciplina de Dispositivos Móveis.
>
> O meu projeto é o **Body Forge**, um aplicativo de rastreamento de treinos de força *local-first*, focado em alta performance e consistência. A ideia é criar uma interface robusta, com a identidade visual que chamei de 'Titanium Steel', trazendo uma experiência *premium* com *dark mode* nativo.
>
> Neste checkpoint, o objetivo foi tirar o projeto do papel: implementar o roteamento das telas, criar a interface estilizada e desenvolver nossos próprios componentes reutilizáveis, além de manter um fluxo organizado com o Git."

---

### Bloco 2: Fluxo de Trabalho no Git [Requisito 1] (1:30 - 3:00)

**[Visual]**
*   Vá para a aba "Pull Requests" do GitHub e filtre por "Closed" (Fechados).
*   Clique em um dos PRs (por exemplo, um focado em UI ou componentes) para mostrar os commits e a revisão.
*   Mostre a aba "Network" ou os branches para ilustrar a separação.

**[Áudio / O que falar]**
> "Atendendo ao primeiro requisito da atividade, mantive um fluxo de trabalho extremamente rigoroso no Git. Em vez de commitar tudo direto na `main`, eu dividi o desenvolvimento em *sprints* e tarefas menores.
>
> Para cada nova funcionalidade, como a criação do layout de abas ou a estilização da tela de estatísticas, eu abri uma nova *branch*, fiz os *commits* de forma semântica e granular, e depois abri um *Pull Request* para a *main*.
>
> Isso evitou conflitos massivos e garantiu que o branch principal estivesse sempre em um estado funcional e limpo."

---

### Bloco 3: Roteamento e Navegação [Requisito 2] (3:00 - 5:00)

**[Visual]**
*   Mova para o emulador/celular rodando o aplicativo Body Forge. Navegue vagarosamente pelas abas na parte inferior (Início, Planos, Treino, Histórico, Estatísticas).
*   Abra o seu editor de código (VS Code) no arquivo `app/(tabs)/_layout.tsx`. Destaque a partir da linha 60.

**[Áudio / O que falar]**
> "Para a navegação, escolhi utilizar o **Expo Router**, que traz um paradigma de roteamento baseado em arquivos, semelhante ao Next.js.
>
> Como vocês podem ver no emulador, temos 5 telas principais acessíveis pela *Bottom Tab Bar* customizada.
>
> Olhando aqui no código, no arquivo `_layout.tsx` dentro da pasta `(tabs)`, eu exporto a função `TabLayout`. Utilizamos o componente `<Tabs>` do Expo Router. Para cada tela, eu defini os meta-dados exigidos pelo requisito na propriedade `options`, onde configurei o título exato da *header* com `title: 'Início'`, `'Planos'`, etc.
>
> Além disso, eu criei uma função chamada `CustomTabBar` (um pouco mais acima no mesmo arquivo) que intercepta a barra de navegação padrão e aplica o estilo 'Titanium Steel' flutuante com ícones da biblioteca `lucide-react-native`."

---

### Bloco 4: Composição de Telas e Estilização [Requisito 3] (5:00 - 7:30)

**[Visual]**
*   Mostre o emulador na aba **Início** (Home). Faça scroll para mostrar os cards de treino, metas de água, etc.
*   Mude o VS Code para `app/(tabs)/index.tsx`. Mostre o uso das tags `className`.
*   Mude o emulador para a aba **Estatísticas**. Mostre os gráficos renderizados.
*   Mude o VS Code para `app/(tabs)/estatisticas.tsx`.

**[Áudio / O que falar]**
> "Atendendo ao requisito de composição, temos não apenas três, mas cinco telas completamente estilizadas. Toda a estilização foi feita utilizando o **NativeWind**, que nos permite usar as classes utilitárias do TailwindCSS diretamente no React Native.
>
> Aqui na tela de **Início** (`index.tsx`), populei o layout com dados *placeholders*. Temos imagens do Unsplash carregadas com opacidade simulando miniaturas de treino, cards de 'Sessões de Hoje' com tempos e calorias fictícios, para mostrar exatamente como a interface se comportará no produto final.
>
> Agora, navegando para a tela de **Estatísticas** (`estatisticas.tsx`), fui além dos *placeholders*. Eu já iniciei a integração com o banco de dados local SQLite. O código possui um estado local e usa o `useEffect` para carregar as métricas corporais do banco via consulta SQL. Assim, quando o usuário clica em 'Registrar' e adiciona um novo peso, o aplicativo já recalcula a evolução e salva a informação real no dispositivo."

---

### Bloco 5: Componentes Personalizados [Requisito 3] (7:30 - 9:00)

**[Visual]**
*   No VS Code, abra a árvore de arquivos e expanda a pasta `components/ui`.
*   Abra o arquivo `components/ui/BarChart.tsx`. Role o código para mostrar o uso da biblioteca de SVG.
*   Se sobrar tempo, abra rapidamente `components/ui/Card.tsx` ou `HeatmapGrid.tsx`.

**[Áudio / O que falar]**
> "Seguindo as boas práticas da disciplina, evitei a repetição de código ao criar uma biblioteca própria de componentes dentro da pasta `components/ui`.
>
> Um grande exemplo é o `BarChart.tsx`. Em vez de importar um gráfico engessado de uma biblioteca pesada, eu construí esse componente personalizado utilizando `react-native-svg`. Ele recebe *props* tipadas como um array de dados, cor da barra e dimensões. Ele itera sobre esses dados mapeando-os matematicamente para retângulos SVG na tela.
>
> Esse nível de personalização foi o que permitiu que os gráficos ficassem perfeitamente alinhados ao tema escuro e às cores de destaque (como o laranja e azul do Body Forge). Temos também componentes como `Card`, `HeatmapGrid` e tipografia, garantindo que se eu precisar mudar o raio da borda de um card no futuro, eu mudo em um só arquivo e o app inteiro é atualizado."

---

### Bloco 6: Atualização do Readme e Considerações Finais [Requisito 4] (9:00 - 10:00)

**[Visual]**
*   Volte para o navegador, mostrando a página do repositório no GitHub.
*   Abra o `README.md` e dê zoom na seção "Atualizações desde o último checkpoint" e na tabela de Sprints.

**[Áudio / O que falar]**
> "Para finalizar, cumprindo o último requisito do checkpoint, o `README.md` do repositório foi completamente atualizado.
>
> Na seção de Sprints, marquei as tarefas de UI/UX, Componentização e Integração do Expo Router como concluídas. E logo abaixo, adicionei a seção 'Atualizações desde o último checkpoint'.
>
> Ali, eu detalhei as tecnologias aplicadas: o uso do *NativeWind* para a estilização consistente, o SQLite nativo para persistência de métricas e como os conceitos de 'Boas práticas para a criação de componentes reutilizáveis' da aula foram fundamentais para isolar a lógica de UI, como acabei de demonstrar com os gráficos.
>
> Com isso, a base visual e arquitetural do Body Forge está sólida para as próximas fases. Muito obrigado pela atenção!"

---

### Dicas Finais para a Gravação de 10 Minutos:
*   **Ensaio:** Leia o roteiro uma vez cronometrando no celular. A depender do seu ritmo de fala (mais calmo ou mais acelerado), você pode precisar omitir alguns detalhes ou fazer pausas mais longas.
*   **Transições:** Como é um vídeo longo, evite deixar a tela estática por muito tempo. Sempre que estiver explicando um trecho de código, selecione as linhas com o mouse para guiar o olhar do professor.
*   **Preparação:** Deixe o VS Code com as guias `_layout.tsx`, `index.tsx`, `estatisticas.tsx` e `BarChart.tsx` já abertas. Deixe o Emulador posicionado ao lado ou use o "Alt+Tab" com maestria.
