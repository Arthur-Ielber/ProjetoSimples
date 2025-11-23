import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuração da conexão MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurante',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Criar pool de conexões
let pool = null;

export const getConnection = async () => {
  try {
    if (!pool) {
      pool = mysql.createPool(dbConfig);
      console.log('[DATABASE] Pool de conexões MySQL criado com sucesso');
      
      // Testar conexão
      const connection = await pool.getConnection();
      console.log('[DATABASE] Conexão com MySQL estabelecida com sucesso');
      connection.release();
    }
    return pool;
  } catch (error) {
    console.error('[DATABASE] Erro ao conectar com MySQL:', error);
    throw error;
  }
};

// Função auxiliar para executar queries
export const query = async (sql, params = []) => {
  try {
    const connection = await getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('[DATABASE] Erro ao executar query:', error);
    throw error;
  }
};

// Função para testar conexão
export const testConnection = async () => {
  try {
    const connection = await getConnection();
    await connection.execute('SELECT 1');
    return { success: true, message: 'Conexão com MySQL estabelecida com sucesso' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default { getConnection, query, testConnection };

