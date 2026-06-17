# Body Forge

> Aplicativo para gerenciamento avançado de treinos de força e hipertrofia, desenvolvido em React Native (Expo).

## Sobre o app

O **Body Forge** é um aplicativo móvel projetado para substituir anotações de treino genéricas, oferecendo uma experiência de registro ultrarrápida (Logger) desenhada para não interromper o fluxo do treino na academia. 

O aplicativo funciona inteiramente offline, garantindo que a instabilidade de rede em academias não afete o usuário. O app suporta desde divisões simples até programas complexos de periodização, incluindo registro de percepção de esforço (RPE), métricas corporais e um sistema de gamificação para consistência.

### Expo Go vs development build (notificações, expo-av)

Alguns módulos nativos **não estão disponíveis ou estão limitados no Expo Go**, em especial no Android com SDK recente:

- **`expo-notifications`:** notificações locais (ex.: meta de água) exigem que o módulo carregue; no Expo Go Android isso pode falhar. Use **`npx expo run:android`** / **`npx expo run:ios`** ou um **development build** (EAS) para testar alertas como no ambiente de produção.
- **`expo-av`:** reprodução de vídeo/áudio com o módulo nativo pode mostrar *Cannot find native module 'ExponentAV'* no Expo Go; o mesmo comando `expo run:*` instala o binário com os nativos corretos.

### Funcionalidades Básicas (Prioritárias)
- [x] **Catálogo de Exercícios:** Base de dados local categorizada por grupo muscular e equipamento, com suporte a exercícios customizados.
- [x] **Construtor de Planos (Workout Planner):** Criação de rotinas estruturadas divididas por dias (ex: Dia 1 - Push, Dia 2 - Pull), com suporte a Supersets e Trisets.
- [x] **Treino Ativo (Logger):** Tela de execução com preenchimento inteligente (herda cargas do treino anterior), inputs rápidos de volume/RPE e cronômetro de descanso automático.
- [x] **Anotações Avançadas:** Capacidade de adicionar notas específicas para cada exercício durante a sessão de treino.
- [x] **Estatísticas e Corpo:** Dashboard com gráficos de volume semanal, estimativa de 1RM e registro de métricas corporais (peso, BF%).

### Funcionalidades Adicionais (Trabalhos Futuros)
- [ ] **Sincronização em Nuvem:** Backup do banco de dados local para serviços como Supabase ou Firebase.
- [ ] **Gamificação Avançada:** Sistema expansível de XP e conquistas por consistência de treino.
- [ ] **Perfis de Usuário (Monetização):** Limitação de funcionalidades para contas Free e relatórios detalhados para contas Premium.

---

## Protótipos de tela

As interfaces foram projetadas seguindo o padrão "Titanium Steel", focado em usabilidade com apenas uma mão e baixo cansaço visual (Dark Mode profundo com detalhes em *Electric Blue* e *Teal*).

* **Ferramenta de Prototipação:** Figma / Stitch AI
* **Vídeo mostrando as telas desenvolvidas da aplicação:**
https://youtube.com/shorts/gYK6iC9IbmU?feature=share
* **Link para o protótipo interativo / visualização:** https://www.figma.com/design/VDWwfS6tJiX8SiTT5LjpKw/Body-Forge?node-id=3-3&t=qXuT2sVVZwhwavma-1

---

## Modelagem do banco

A persistência de dados será estritamente **Local**, utilizando **SQLite** (via Expo SQLite ou WatermelonDB). O banco é relacional e foi projetado para suportar hierarquias complexas de treino (Rotina > Dia > Exercício) e o histórico detalhado de cada série executada.

* **Ferramenta utilizada:** DB Diagram
* **Modelo Entidade-Relacionamento (DER):**
* <img width="1609" height="1461" alt="Untitled" src="https://github.com/user-attachments/assets/d10e98a2-0115-4947-8843-328592b6ef94" />

### Estrutura Base de Dados (Tabelas Atuais)
O banco principal conta atualmente com a seguinte estrutura lógica mapeada no app:
1. `users`: Gerencia os dados do perfil local e a altura do usuário (para cálculos médicos).
2. `body_metrics`: Histórico de métricas de pesagem e percentual de gordura ao longo do tempo.
3. `exercises`: O catálogo principal contendo metadados (equipamento, parte do corpo), mapeamento de API e caminhos dos GIFs.
4. `exercise_media` & `exercise_notes`: Tabelas auxiliares para armazenar links e notas atemporais sobre exercícios específicos.
5. `routines`: Os programas/planos macro de treinamento, classificados por categoria.
6. `routine_days`: A subdivisão da rotina em dias de treino.
7. `routine_exercises`: A amarração do exercício ao dia, lidando com Supersets, ordem e atributos aninhados de setup (`set_configs`).
8. `sessions`: O registro do treino executado, controlando duração e volume total levantado.
9. `session_exercises`: O agrupador que copia os dados do plano no momento da execução, registrando supersets e notas exclusivas daquele dia.
10. `sets`: O registro exato de cada série, abrangendo Carga, Repetições, tipo de série (`is_warmup`, `is_dropset`) e controle de conclusão.

---

## Planejamento de sprints

O desenvolvimento está estruturado em 6 Sprints semanais, focando inicialmente na infraestrutura de dados e avançando para a interface e gamificação nas semanas finais.

* [x] **Sprint 1 (Semana 1): Infraestrutura e Navegação Base**
  * Configuração do Expo, React Navigation (Tabs) e repositório.
  * Implementação da conexão SQLite e execução das *migrations* iniciais.
  * Criação do *Seed* de dados com exercícios básicos no catálogo.

* [x] **Sprint 2 (Semana 2): Biblioteca e Métricas Corporais**
  * Tela de "Listagem de Exercícios" com pesquisa e filtros (Músculo/Equipamento).
  * Tela de "Corpo" para registrar inserções na tabela `body_metrics`.

* [x] **Sprint 3 (Semana 3): O Construtor de Planos (Planner)**
  * Interface "Configuração do Plano" na tabela `routines`.
  * Interface "Editor de Dias" e atrelamento lógico à tabela `routine_exercises`.
  * Funcionalidades de arrastar (Drag and Drop), Supersets e exclusão.

* [x] **Sprint 4 (Semana 4 & 5): O Treino Ativo (Logger) - O Coração do App**
  * Desenvolvimento da tela "Treino Ativo" usando FlashList otimizada.
  * Componentes numéricos e botões de `is_completed` alimentando a tabela `sets`.
  * Lógica de "Preenchimento Inteligente" (herança de carga do treino anterior).
  * Timer global construído com Zustand.

* [x] **Sprint 5 (Semana 6): Dataset, Estatísticas Funcionais, Histórico e Otimizações**
  * Adição de dataset de exercícios com GIFs, instruções e nome do exercício (`exercises_seed.json`).
  * Reformulação da Tela de Planos com carrosséis por categoria e planos prontos (built-in).
  * Tela de Estatísticas Funcional com filtros de período, gráfico rosquinha de foco muscular (primário/secundário) e gráfico de barras de treinos ao longo do tempo.
  * Melhoria nos gráficos da tela inicial (Volume, Consistência RPE, Foco Muscular semanal).
  * Adição de estatísticas do treino (por plano) e do exercício (histórico, volume semanal, tendência de carga).
  * Tela de Histórico com calendário mensal e detalhes de sessões passadas.
  * Cálculo real de streak (sequência de dias consecutivos) na tela de conclusão do treino.
  * Detecção de Recorde Pessoal (PR) no histórico de cada exercício.
  * Otimização de queries no dashboard (N+1 → JOIN único), hook leve `useCalendarData` para reduzir re-renders.
  * Tradução completa de modais para PT-BR.

* [x] **Sprint 6 (Semana 7): Polimento, Configurações e Entrega**
  * Tela de "Configurações" consolidada (Gerenciamento de DB, Backup CSV).
  * Implementação em cascata de Sistema Dinâmico de Unidades (LBS/KG, IN/CM).
  * Notificações avançadas e robustas via `@notifee/react-native` configurando Foreground Services em Android.
  * Geração de Builds via EAS (*Expo Application Services*).

---

## Atualizações desde o último checkpoint

Abaixo estão listados os recursos e conceitos dos módulos da disciplina aplicados até o momento no projeto:

### 03 | Boas práticas para a criação de componentes reutilizáveis
A estrutura do app (pastas `components/ui` e `components/planner`) foi desenhada seguindo fielmente as práticas deste módulo:
* **Isolamento de componentes que se repetem:** Componentes de interface base foram isolados na pasta `ui`, como o `Button.tsx` e `Typography.tsx`, evitando repetição de código nas telas.
* **Uso de nomenclaturas minimalistas:** Adoção de nomes descritivos mas diretos em seu contexto, como `Card`, `Container` e `DayCard`.
* **Parametrização de componentes:** O componente `Button.tsx` foi parametrizado para aceitar variantes (ex: primário, outline) e repassar atributos nativos através do *props spreading* (`...props`).
* **Componentes que recebem filhos (children):** Uso intenso do padrão *Composition* em `Card.tsx` e `Container.tsx`, servindo como blocos construtores (*wrappers*) que encapsulam outras estruturas mantendo o layout global.
* **Uso de mocks de dados:** Mocks locais foram utilizados para popular as interfaces e validar o layout antes da integração com o banco, como visto nos arrays `basePlans` e `featuredPlan` na tela de Planos (`app/(tabs)/planos.tsx`).
* **Componentes que disparam eventos para o pai:** Implementado em componentes complexos, como o `CoverImagePickerModal.tsx`, que realiza a busca e paginação de imagens (via **Unsplash API**) e emite a URL selecionada de volta para a tela através do *callback* `onSelectCover`.

### 06 | Roteamento Avançado com Expo Router
* **Navegação avançada e por abas (Tabs) com layouts aninhados:** Todo o roteamento é construído utilizando o padrão "file-based routing" do Expo Router. A estrutura garante a barra de navegação principal configurada no `app/(tabs)/_layout.tsx`, enquanto permite o fluxo de páginas e modais empilhados fora das abas (ex: telas dentro de `app/planner/...` e `app/exercises/...`).

### 07 | Estilização de componentes com NativeWind
* **Convertendo a estilização tradicional para Tailwind CSS:** O projeto utiliza o NativeWind para toda a camada visual, substituindo o tradicional `StyleSheet` pelo uso ágil de classes utilitárias diretamente nos componentes. A paleta do design system do app ("Titanium Steel") foi registrada no arquivo global `tailwind.config.js`, permitindo o uso imediato de cores customizadas em qualquer parte do código (ex: `bg-forge-bg`, `text-forge-accent`).
