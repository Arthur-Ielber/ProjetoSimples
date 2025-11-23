// Script para testar se a API está funcionando
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testando conexão com a API...\n');
  
  try {
    // Teste 1: Configurações
    console.log('1️⃣ Testando GET /api/configuracoes...');
    const configResponse = await fetch(`${API_URL}/configuracoes`);
    console.log('   Status:', configResponse.status);
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('   ✅ Sucesso! Configurações:', {
        telefone: configData.telefone,
        email: configData.email,
        tem_foto_inicial: configData.tem_foto_inicial,
        tem_foto_historia: configData.tem_foto_historia,
      });
    } else {
      const error = await configResponse.text();
      console.log('   ❌ Erro:', error);
    }
    
    // Teste 2: Mesas
    console.log('\n2️⃣ Testando GET /api/mesas...');
    const mesasResponse = await fetch(`${API_URL}/mesas`);
    console.log('   Status:', mesasResponse.status);
    
    if (mesasResponse.ok) {
      const mesasData = await mesasResponse.json();
      console.log('   ✅ Sucesso! Total de mesas:', Array.isArray(mesasData) ? mesasData.length : 'N/A');
    } else {
      const error = await mesasResponse.text();
      console.log('   ❌ Erro:', error);
    }
    
    // Teste 3: Ementa
    console.log('\n3️⃣ Testando GET /api/ementa...');
    const ementaResponse = await fetch(`${API_URL}/ementa`);
    console.log('   Status:', ementaResponse.status);
    
    if (ementaResponse.ok) {
      const ementaData = await ementaResponse.json();
      console.log('   ✅ Sucesso! Total de itens:', Array.isArray(ementaData) ? ementaData.length : 'N/A');
    } else {
      const error = await ementaResponse.text();
      console.log('   ❌ Erro:', error);
    }
    
    console.log('\n✅ Testes concluídos!');
    
  } catch (error) {
    console.error('\n❌ Erro ao conectar com a API:', error.message);
    console.error('\n💡 Verifique se:');
    console.error('   1. O servidor está rodando (npm run dev ou npm run server)');
    console.error('   2. A porta 3001 está livre');
    console.error('   3. O banco de dados MySQL está conectado');
  }
}

testAPI();

