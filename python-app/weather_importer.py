import mysql.connector
from mysql.connector import Error
import time
import os
from dotenv import load_dotenv
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()
def test_mysql_connection():
    configs = [
        {
            'name': 'Docker MySQL',
            'host': 'localhost',
            'port': 3306,
            'database': os.getenv('DB_NAME', 'myapp_db'),
            'user': os.getenv('DB_USER', 'myuser'),
            'password': os.getenv('DB_PASSWORD', 'mypassword')
        },
        {
            'name': 'Root user',
            'host': 'localhost', 
            'port': 3306,
            'database': '',
            'user': 'root',
            'password': 'rootpassword'
        }
    ]
    
    for config in configs:
        logger.info(f"Testing connection to {config['name']}...")
        
        try:
            connection = mysql.connector.connect(
                host=config['host'],
                port=config['port'],
                database=config['database'],
                user=config['user'],
                password=config['password'],
                connection_timeout=3
            )
            
            if connection.is_connected():
                logger.info(f"✅ SUCCESS: {config['name']}")
                cursor = connection.cursor()
                cursor.execute("SELECT VERSION()")
                version = cursor.fetchone()
                logger.info(f"   MySQL Version: {version[0]}")
                connection.close()
            else:
                logger.error(f"❌ FAILED: {config['name']}")
                
        except Error as e:
            logger.error(f"❌ ERROR {config['name']}: {e}")

def check_port(host='localhost', port=3306):
    """Kiểm tra port có mở không"""
    import socket
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

if __name__ == "__main__":
    logger.info("🔍 Testing MySQL Connection...")
    
    # Kiểm tra port
    if check_port():
        logger.info("✅ Port 3306 is open")
    else:
        logger.error("❌ Port 3306 is closed")
        logger.info("Hãy chạy: docker-compose up -d")
    test_mysql_connection()