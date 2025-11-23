# Instruções para Adicionar Campo BLOB na Tabela Ementa

## Passo 1: Executar o Script SQL

1. Abra o MySQL Workbench
2. Conecte-se ao banco de dados `restaurante`
3. Abra o arquivo `database/add_imagem_blob.sql`
4. Execute o script (Ctrl+Shift+Enter ou botão Execute)

O script irá:
- Adicionar a coluna `imagem_blob` do tipo `MEDIUMBLOB` na tabela `ementa`
- Verificar se a coluna já existe antes de adicionar (evita erros)

## Passo 2: Verificar

Execute este comando para verificar se a coluna foi adicionada:

```sql
DESCRIBE ementa;
```

Você deve ver a coluna `imagem_blob` do tipo `mediumblob` na lista.

## Como Funciona Agora

1. **Upload de Imagem**: Quando você faz upload de uma imagem:
   - O arquivo é convertido para base64
   - O base64 é enviado junto com os dados do item
   - O servidor converte base64 para Buffer e salva no campo `imagem_blob`

2. **Exibição de Imagem**: 
   - Se o item tem `imagem_blob`, a URL será `/api/upload/ementa/{id}`
   - O servidor busca o BLOB do banco e retorna como imagem
   - Se o item tem apenas `imagem_url`, usa a URL normalmente

3. **Compatibilidade**:
   - Itens antigos com apenas `imagem_url` continuam funcionando
   - Novos itens podem usar `imagem_blob` ou `imagem_url`
   - O sistema prioriza `imagem_blob` se existir

## Tamanho Máximo

- **MEDIUMBLOB**: Até 16MB (suficiente para a maioria das imagens)
- Se precisar de mais espaço, altere para `LONGBLOB` (até 4GB) no script SQL

## Notas Importantes

⚠️ **Atenção**: Salvar imagens como BLOB no banco de dados:
- ✅ Vantagem: Tudo em um lugar, backup automático
- ❌ Desvantagem: Banco fica mais pesado, queries mais lentas, backup maior

Para produção, considere usar um serviço de storage (AWS S3, Cloudinary, etc.)

