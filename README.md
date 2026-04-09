# Body Forge

> Aplicativo para gerenciamento avançado de treinos de força e hipertrofia, desenvolvido em React Native (Expo).

## Sobre o app

O **Body Forge** é um aplicativo móvel projetado para substituir anotações de treino genéricas, oferecendo uma experiência de registro ultrarrápida (Logger) desenhada para não interromper o fluxo do treino na academia. 

O aplicativo funciona inteiramente offline, garantindo que a instabilidade de rede em academias não afete o usuário. O app suporta desde divisões simples até programas complexos de periodização, incluindo registro de percepção de esforço (RPE), métricas corporais e um sistema de gamificação para consistência.

### Funcionalidades Básicas (Prioritárias)
- [ ] **Catálogo de Exercícios:** Base de dados local categorizada por grupo muscular e equipamento, com suporte a exercícios customizados.
- [ ] **Construtor de Planos (Workout Planner):** Criação de rotinas estruturadas divididas por dias (ex: Dia 1 - Push, Dia 2 - Pull), com suporte a Supersets e Trisets.
- [ ] **Treino Ativo (Logger):** Tela de execução com preenchimento inteligente (herda cargas do treino anterior), inputs rápidos de volume/RPE e cronômetro de descanso automático.
- [ ] **Anotações Avançadas:** Capacidade de adicionar notas específicas para cada exercício durante a sessão de treino.
- [ ] **Estatísticas e Corpo:** Dashboard com gráficos de volume semanal, estimativa de 1RM e registro de métricas corporais (peso, BF%).

### Funcionalidades Adicionais (Trabalhos Futuros)
- [ ] **Sincronização em Nuvem:** Backup do banco de dados local para serviços como Supabase ou Firebase.
- [ ] **Gamificação Avançada:** Sistema expansível de XP e conquistas por consistência de treino.
- [ ] **Perfis de Usuário (Monetização):** Limitação de funcionalidades para contas Free e relatórios detalhados para contas Premium.

---

## Protótipos de tela

As interfaces foram projetadas seguindo o padrão "Titanium Steel", focado em usabilidade com apenas uma mão e baixo cansaço visual (Dark Mode profundo com detalhes em *Electric Blue* e *Teal*).

* **Ferramenta de Prototipação:** Figma / Stitch AI
* **Link para o protótipo interativo / visualização:** https://www.figma.com/design/VDWwfS6tJiX8SiTT5LjpKw/Body-Forge?node-id=3-3&t=qXuT2sVVZwhwavma-1

---

## Modelagem do banco

A persistência de dados será estritamente **Local**, utilizando **SQLite** (via Expo SQLite ou WatermelonDB). O banco é relacional e foi projetado para suportar hierarquias complexas de treino (Rotina > Dia > Exercício) e o histórico detalhado de cada série executada.

* **Ferramenta utilizada:** DrawSQL / diagrams.net
* **Modelo Entidade-Relacionamento (DER):**
* <img width="984" height="897" alt="image" src="https://github.com/user-attachments/assets/e75f0674-6846-4ee5-8d1d-67058cfd474c" />

### Estrutura Base de Dados (Tabelas)
O banco de dados é composto por 10 tabelas principais:
1. `users`: Gerencia os dados base do perfil, status premium e XP de gamificação.
2. `body_metrics`: Histórico de peso e percentual de gordura do usuário.
3. `exercises`: O catálogo mestre de movimentos, agrupados por músculo/equipamento.
4. `routines`: Os programas de treinamento macro (ex: "PPL Hipertrofia").
5. `routine_days`: A subdivisão da rotina em dias específicos (ex: "Dia 1 - Push").
6. `routine_exercises`: A relação de quais exercícios pertencem a qual dia, incluindo ordem e grupos de *Superset*.
7. `sessions`: O registro histórico de uma ida à academia (Início, Fim, Volume Total).
8. `session_exercises`: O agrupador de séries de um exercício específico naquele dia, permitindo anotações isoladas.
9. `sets`: Registro exato de Carga, Repetições e RPE de cada série.
10. `reminders`: Configurações de alarmes locais para consistência de treino e pesagem.

---

## Planejamento de sprints

O desenvolvimento está estruturado em 6 Sprints semanais, focando inicialmente na infraestrutura de dados e avançando para a interface e gamificação nas semanas finais.

* [x] **Sprint 1 (Semana 1): Infraestrutura e Navegação Base**
  * Configuração do Expo, React Navigation (Tabs) e repositório.
  * Implementação da conexão SQLite e execução das *migrations* das 10 tabelas criadas.
  * Criação do *Seed* de dados com exercícios básicos no catálogo.

* [ ] **Sprint 2 (Semana 2): Biblioteca e Métricas Corporais**
  * Tela de "Listagem de Exercícios" com pesquisa e filtros (Músculo/Equipamento).
  * Tela de "Corpo" para registrar inserções na tabela `body_metrics`.
  * Criação do componente visual de Gráfico de Linha simples para evolução do peso.

* [ ] **Sprint 3 (Semana 3): O Construtor de Planos (Planner)**
  * Interface "Configuração do Plano" (Nome e setup inicial na tabela `routines`).
  * Interface "Editor de Dias" permitindo criar abas (Dia 1, Dia 2) na tabela `routine_days`.
  * Lógica para buscar exercícios no catálogo e atrelá-los a um dia (`routine_exercises`).

* [ ] **Sprint 4 (Semana 4): O Treino Ativo (Logger) - O Coração do App**
  * Desenvolvimento da tela "Treino Ativo" renderizando os exercícios do dia escolhido.
  * Componentes numéricos de fácil toque (Carga/Reps/RPE) e marcação de série concluída (Tabela `sets`).
  * Lógica de "Preenchimento Inteligente": Query que busca e exibe a carga da última sessão.

* [ ] **Sprint 5 (Semana 5): Histórico, Cronômetro e Estatísticas**
  * Implementação do Timer de Descanso executando em background (estado global com Zustand).
  * Tela de Resumo Pós-Treino calculando o volume total da `session`.
  * Dashboard de "Estatísticas" integrando queries de agrupamento para o gráfico rosquinha (volume por músculo).

* [ ] **Sprint 6 (Semana 6): Gamificação, Polimento e Entrega**
  * Implementação da tela "Treino Concluído" exibindo ganho de XP e Troféus.
  * Refinamento visual aplicando os detalhes da UI "Titanium Steel" (Ajuste de cores e *haptics* de vibração do Expo).
  * Atualização da documentação (este README) e build final (APK) para entrega do Checkpoint.
