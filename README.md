# 📱 ReabTrack Mobile

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

> **O companheiro digital do Fisioterapeuta.**

Este é o aplicativo móvel do projeto **ReabTrack**, desenvolvido como Trabalho de Conclusão de Curso (TCC) em Ciência da Computação. Ele serve como a interface principal para que fisioterapeutas gerenciem pacientes, planos de reabilitação e acompanhem a evolução clínica com suporte de Inteligência Artificial.

## ✨ O que ele faz?

* **Prontuário Digital:** Registre sessões com notas SOAP e avaliações de dor/esforço em segundos.
* **Visualização de Dados:** Acompanhe o progresso do paciente através de **gráficos interativos** de evolução.
* **Laudos Inteligentes:** Gere e exporte relatórios clínicos completos em **PDF**, formatados automaticamente e prontos para assinatura.
* **Gestão na Palma da Mão:** Controle total de pacientes, planos de tratamento e agendamentos.

## 🛠️ Por baixo do capô

O projeto foi construído com foco em performance e experiência do usuário (UX):

* **Core:** React Native com Expo (SDK 51).
* **Linguagem:** TypeScript para tipagem estática e segurança.
* **Estado e Cache:** TanStack Query (React Query) para sincronização de dados eficiente.
* **Navegação:** React Navigation (Stack & Tabs).
* **Recursos Nativos:** `expo-print` para geração de PDF e `react-native-chart-kit` para visualização de dados.

## 🚀 Como Rodar

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/ArthurPSampaio/ReabTrack-mobile-df.git](https://github.com/ArthurPSampaio/ReabTrack-mobile-df.git)
    cd ReabTrack-mobile-df
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Ambiente:**
    Crie um arquivo `.env` na raiz (baseado no IP da sua máquina):
    ```env
    EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000
    ```

4.  **Inicie o projeto:**
    ```bash
    npx expo start
    ```
    *Escaneie o QR Code com o app Expo Go (Android/iOS).*

## 🔗 Ecossistema

Este app funciona em conjunto com:
* **Backend:** [reabtrack-backend](https://github.com/ArthurPSampaio/reabtrack-backend)
* **Inteligência Artificial:** [reabtrack-ai](https://github.com/ArthurPSampaio/reabtrack-ai)

---
Desenvolvido por **Arthur Sampaio** | TCC 2025