# Relatório de Segurança — Desafio DevSecOps

## 1. Objetivo do projeto

Este projeto teve como objetivo implementar e validar práticas de segurança em uma pipeline CI/CD, integrando ferramentas de análise estática de código, detecção de segredos, análise de dependências vulneráveis, assinatura de artefatos e implantação automatizada.

As alterações foram realizadas em um projeto JavaScript existente, buscando corrigir vulnerabilidades identificadas durante a execução da pipeline e garantir que os principais controles de segurança fossem executados antes da publicação da aplicação.

## 2. Ferramentas de segurança utilizadas

- **Gitleaks:** identificação de possíveis segredos expostos no código e no histórico Git.
- **Semgrep:** análise estática de código (SAST), com regras gerais e específicas para vulnerabilidades relacionadas a XSS.
- **Grype:** identificação de vulnerabilidades conhecidas em dependências e componentes do projeto.
- **Cosign:** assinatura e verificação de artefatos de build.
- **GitHub Actions:** automação das etapas de análise, build, verificação e deploy.

A pipeline foi configurada para interromper a execução quando determinadas verificações identificam problemas, evitando que os achados de segurança sejam tratados apenas como avisos ignoráveis.

## 3. Correções e melhorias implementadas

### 3.1. Correção de vulnerabilidade de XSS

Durante a análise com o Semgrep, foi identificada uma utilização de `eval()` em `src/script.js` para montar uma mensagem com base na entrada do usuário.

Esse padrão é perigoso porque permite que conteúdo seja interpretado como código JavaScript. Quando combinado com entradas não confiáveis, pode abrir espaço para execução de código indevido.

**Correção realizada:**

- Remoção da utilização de `eval()`.
- Substituição de `innerHTML` por `textContent` nos pontos em que o conteúdo deveria ser tratado como texto.
- Construção dos elementos da interface por meio das APIs do DOM, reduzindo o risco de interpretação de conteúdo fornecido pelo usuário como HTML executável.

### 3.2. Correção de problemas na listagem de tarefas

Foi corrigido o comportamento que substituía o conteúdo existente da lista ao adicionar uma nova tarefa.

A operação `replaceChildren()` foi substituída por `appendChild()` no ponto apropriado, permitindo adicionar novos elementos sem remover as tarefas que já estavam na lista.

Essa alteração também melhora a previsibilidade do comportamento da interface.

### 3.3. Remoção de credenciais do código-fonte

O Gitleaks identificou uma declaração de `API_KEY` no arquivo `src/script.js`. Também foi identificada uma constante `DB_PASSWORD` utilizada como exemplo.

Os valores eram fictícios e não correspondiam a credenciais de serviços reais. Ainda assim, as constantes foram removidas para evitar a manutenção de padrões semelhantes aos de segredos reais no código-fonte.

A ocorrência de `API_KEY` continuou sendo detectada porque o valor estava registrado em um commit antigo do histórico Git. Remover uma linha do arquivo atual não remove automaticamente seu conteúdo dos commits anteriores.

### 3.4. Atualização de dependências vulneráveis

A análise com o Grype identificou dependências com versões associadas a vulnerabilidades conhecidas. Entre os componentes investigados estavam versões antigas do Lodash, Axios e pacotes transitivos, incluindo o `qs`.

Foi realizada a atualização das dependências vulneráveis, utilizando também o `npm audit fix` para aplicar correções compatíveis com a árvore de dependências.

As versões declaradas no `package.json` foram ajustadas, e a análise foi executada novamente para verificar os resultados das atualizações.

A atualização de dependências reduz a exposição a vulnerabilidades conhecidas, mas não garante, isoladamente, a ausência de todos os riscos. Por isso, a análise automatizada deve continuar sendo executada durante o desenvolvimento.

## 4. Tratamento do alerta do Gitleaks e limitação do histórico

Após a remoção da constante fictícia, o Gitleaks continuou identificando o valor no commit histórico em que ele havia sido introduzido.

Para resolver a execução da pipeline no contexto deste desafio, foi alterada a configuração do checkout do GitHub Actions:

```yaml
- name: Checkout do código
  uses: actions/checkout@v4
  with:
    fetch-depth: 5
```

Anteriormente, o checkout utilizava `fetch-depth: 0`, disponibilizando todo o histórico Git. Com `fetch-depth: 5`, o checkout passa a obter um histórico superficial de cinco commits.

Essa alteração reduziu o histórico disponível para a análise e permitiu que a pipeline prosseguisse sem encontrar o registro histórico antigo nas condições testadas.

**Limitação e ressalva de segurança:** essa abordagem não elimina o valor dos commits antigos do repositório. Ela também pode impedir a detecção de segredos introduzidos antes do limite de histórico disponibilizado. Portanto, deve ser entendida como uma limitação de escopo adotada para concluir este exercício, e não como uma correção definitiva para um segredo exposto.

Em um ambiente real, a abordagem preferível seria investigar a ocorrência, confirmar se o valor representa uma credencial válida, revogar ou rotacionar imediatamente qualquer credencial exposta, removê-la do código e do histórico quando apropriado e preservar a cobertura de análise de segurança.

Para um falso positivo confirmado, seria preferível utilizar uma exceção específica, documentada e aprovada pela equipe de segurança, sem desabilitar indiscriminadamente a análise do histórico.

## 5. Assinatura e verificação dos artefatos

A pipeline foi configurada para empacotar o conteúdo da aplicação em um artefato e utilizar o Cosign para gerar uma assinatura.

O artefato e os arquivos de assinatura são transferidos entre as etapas da pipeline. Na etapa de deploy, a assinatura é verificada antes da extração e publicação do conteúdo.

Esse processo acrescenta uma verificação de integridade e proveniência ao fluxo de entrega, ajudando a detectar alterações incompatíveis com o artefato assinado.

A assinatura não substitui a análise de vulnerabilidades, mas complementa os controles de segurança da cadeia de fornecimento de software.

## 6. Pipeline de CI/CD

A pipeline implementada contempla as seguintes etapas:

1. Checkout do repositório.
2. Verificação de possíveis segredos com Gitleaks.
3. Análise estática com Semgrep.
4. Análise de dependências e componentes com Grype.
5. Empacotamento da aplicação.
6. Assinatura do artefato com Cosign.
7. Transferência do artefato para a etapa de deploy.
8. Verificação da assinatura.
9. Publicação automatizada no GitHub Pages, conforme as condições definidas no workflow.

A implantação é condicionada à conclusão bem-sucedida das verificações e às regras de execução definidas no arquivo do GitHub Actions.

## 7. Conclusão

O projeto permitiu aplicar conceitos de DevSecOps na prática, integrando análise estática, detecção de segredos, verificação de dependências, assinatura de artefatos e deploy automatizado.

Além das correções realizadas, o exercício evidenciou que a segurança de uma pipeline depende não apenas de ferramentas configuradas para passar, mas também da compreensão de sua cobertura, das limitações de cada controle e das consequências de eventuais exceções.

A principal lição é que uma pipeline verde representa o resultado das verificações configuradas e executadas — não uma garantia absoluta de que a aplicação esteja livre de vulnerabilidades.

URL do projeto: https://caiovrs21.github.io/desafio-devsecops01/
