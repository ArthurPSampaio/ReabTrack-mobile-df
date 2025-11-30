# 📱 ReabTrack Mobile

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

> **O companheiro digital do Fisioterapeuta.**

Este é o cliente mobile do projeto **ReabTrack**, desenvolvido como Trabalho de Conclusão de Curso (TCC) em Ciência da Computação. O aplicativo serve como a interface principal para gestão de pacientes, planos de reabilitação e visualização de relatórios inteligentes.

## ✨ Funcionalidades Principais

* **Gestão Completa:** CRUD de Pacientes e Planos de Tratamento.
* **Prontuário Digital:** Registro de sessões com notas SOAP (Subjetivo, Objetivo, Avaliação, Plano).
* **Visualização de Dados:** Gráficos interativos de evolução (Dor vs. Esforço) utilizando `react-native-chart-kit`.
* **Laudos Inteligentes:** Geração e exportação de relatórios clínicos em **PDF** formatado profissionalmente, alimentados pela IA do sistema.
* **UX Otimizada:** Interface limpa, feedbacks visuais e navegação fluida.

## 🛠️ Tecnologias Utilizadas

* **Core:** React Native (via Expo SDK 51)
* **Linguagem:** TypeScript
* **Gerenciamento de Estado:** TanStack Query (React Query)
* **Navegação:** React Navigation (Stack & Tabs)
* **Ferramentas:** Expo Print (PDF), Expo Sharing, Async Storage.

## 🚀 Como Rodar

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/reabtrack-mobile.git](https://github.com/seu-usuario/reabtrack-mobile.git)
    cd reabtrack-mobile
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Ambiente:**
    Crie um arquivo `.env` na raiz com o endereço do seu backend:
    ```env
    EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000
    ```

4.  **Inicie o projeto:**
    ```bash
    npx expo start
    ```
    *Use o app Expo Go no seu celular ou um emulador Android/iOS.*

---
Desenvolvido por **Arthur Sampaio** | TCC 2025