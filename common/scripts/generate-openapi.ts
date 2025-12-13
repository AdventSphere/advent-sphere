import { writeFileSync } from 'fs';
import { resolve } from 'path';
import app from '../../backend/src';
import { join } from 'path';

async function generateOpenAPI() {
  try {
    // openapi.json エンドポイントをシミュレート
    const request = new Request('http://localhost/openapi.json', {
      method: 'GET',
    });

    const response = await app.fetch(request);
    const openapi = await response.json();

    // ローカルファイルに保存
    const outputPath = join(resolve(process.cwd(), 'generate'), 'openapi.json');
    writeFileSync(outputPath, JSON.stringify(openapi, null, 2));

    console.log(`✓ OpenAPI schema generated: ${outputPath}`);
  } catch (error) {
    console.error('Error generating OpenAPI schema:', error);
    process.exit(1);
  }
}

generateOpenAPI();

