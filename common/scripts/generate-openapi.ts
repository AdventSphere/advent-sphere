import { writeFileSync } from "fs";
import app from "../../backend/src";

async function generateOpenAPI() {
  try {
    // openapi.json エンドポイントをシミュレート
    const request = new Request("http://localhost/openapi.json", {
      method: "GET",
    });

    const response = await app.fetch(request);
    const openapi = await response.json();

    // ローカルファイルに保存
    writeFileSync("openapi.json", JSON.stringify(openapi, null, 2));

    console.log(`✓ OpenAPI schema generated: openapi.json`);
  } catch (error) {
    console.error("Error generating OpenAPI schema:", error);
    process.exit(1);
  }
}

generateOpenAPI();
