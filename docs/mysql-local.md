# MySQL local no Windows

O MySQL Workbench é apenas a ferramenta de administração. Confirme que o **MySQL Server** está instalado e que o serviço está iniciado antes de aplicar migrações. O projeto nunca usa `root` durante a execução normal.

## 1. Criar schemas e usuários no Workbench

Execute como administradora, substituindo as senhas de exemplo:

```sql
CREATE DATABASE IF NOT EXISTS nexus_infinito CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS nexus_infinito_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nexus_app'@'localhost' IDENTIFIED BY 'troque_esta_senha';
CREATE USER IF NOT EXISTS 'nexus_test'@'localhost' IDENTIFIED BY 'troque_esta_senha_de_teste';
CREATE USER IF NOT EXISTS 'nexus_migrator'@'localhost' IDENTIFIED BY 'troque_esta_senha_de_migracao';
GRANT SELECT, INSERT, UPDATE, DELETE ON nexus_infinito.* TO 'nexus_app'@'localhost';
GRANT ALL PRIVILEGES ON nexus_infinito_test.* TO 'nexus_test'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES ON nexus_infinito.* TO 'nexus_migrator'@'localhost';
FLUSH PRIVILEGES;
```

O host da conta precisa corresponder à conexão. Para `127.0.0.1`, alguns ambientes exigem criar também `'nexus_app'@'127.0.0.1'`.

## 2. Configurar o ambiente

Copie `.env.example` para `.env` e informe a credencial real. O arquivo `.env` é ignorado pelo Git. Nunca use `NEXT_PUBLIC_` para a conexão.

```dotenv
DATABASE_URL="mysql://nexus_app:SENHA@127.0.0.1:3306/nexus_infinito"
TEST_DATABASE_URL="mysql://nexus_test:SENHA@127.0.0.1:3306/nexus_infinito_test"
```

Senhas com caracteres reservados de URL devem ser percent-encoded. Para um provedor remoto, troque host, porta e credenciais e aplique o TLS exigido pelo provedor; motor e interface não mudam.

## 3. Verificar e migrar

Use temporariamente a URL do usuário `nexus_migrator` ao aplicar migrações; depois restaure a URL do usuário `nexus_app`:

```bash
npm run db:check
npm run db:generate
npm run db:migrate:deploy
```

`db:check` executa `SELECT VERSION(), DATABASE()` e mostra uma mensagem explícita se serviço, schema ou credenciais não estiverem disponíveis. Nenhuma migração é executada ao iniciar a aplicação.

## 4. Testes isolados

Primeiro aplique as mesmas migrações em `nexus_infinito_test`, usando `TEST_DATABASE_URL` como `DATABASE_URL` no terminal. Depois execute `npm run test:mysql`. Os testes removem apenas os próprios registros e nunca limpam o schema de desenvolvimento.
