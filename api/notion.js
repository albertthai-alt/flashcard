// api/notion.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, msg: "Method not allowed" });
    }

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    if (!NOTION_TOKEN) {
      console.error("Missing NOTION_TOKEN");
      return res.status(500).json({ ok: false, error: "Server missing NOTION_TOKEN" });
    }

    // body may be parsed by Vercel already
    let body = req.body;
    if (!body) {
      // try to fallback to raw reading (rare)
      let raw = "";
      try {
        raw = await new Promise((resolve, reject) => {
          let data = "";
          req.on && req.on("data", c => data += c);
          req.on && req.on("end", () => resolve(data || "{}"));
          setTimeout(() => resolve("{}"), 50);
        });
        body = JSON.parse(raw || "{}");
      } catch (e) {
        body = {};
      }
    }

    const headers = {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };

    // Handle different actions
    const { action } = body;

    // List databases
    if (action === 'list_databases') {
      const response = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers,
        body: JSON.stringify({
          filter: { property: "object", value: "database" },
          page_size: 100
        })
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Create a new page in a database
    if (action === 'create_page' && body.database_id) {
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          parent: { database_id: body.database_id },
          properties: body.properties
        })
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Find or create database by name
    if (action === 'find_or_create_database') {
      const { database_name: databaseName } = req.body;
      
      if (!databaseName) {
        return res.status(400).json({ ok: false, error: 'Database name is required' });
      }

      try {
        // First, try to find the database by name
        const searchResponse = await fetch("https://api.notion.com/v1/search", {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: databaseName,
            filter: { property: "object", value: "database" },
            sort: { direction: "descending", timestamp: "last_edited_time" },
          }),
        });

        const searchData = await searchResponse.json();

        // Check if we found any databases with this name
        const existingDb = searchData.results.find(db => 
          db.object === 'database' && 
          db.title[0]?.plain_text?.toLowerCase() === databaseName.toLowerCase()
        );

        if (existingDb) {
          return res.json({
            ok: true,
            id: existingDb.id,
            name: existingDb.title[0]?.plain_text || databaseName,
            created: false
          });
        }

        // Get parent page ID from environment variable
        const parentPageId = process.env.NOTION_PAGE_ID;
        
        if (!parentPageId) {
          return res.status(400).json({
            ok: false,
            error: 'NOTION_PAGE_ID environment variable is not set. Please set it to create a new database.'
          });
        }

        // Create a new database in the specified parent page
        const createResponse = await fetch("https://api.notion.com/v1/databases", {
          method: "POST",
          headers,
          body: JSON.stringify({
            parent: { page_id: parentPageId },
            title: [{ type: 'text', text: { content: databaseName } }],
            properties: {
              'Name': { title: {} },
              'Term': { rich_text: {} },
              'Definition': { rich_text: {} }
            }
          })
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
          console.error('Error creating database:', createData);
          return res.status(createResponse.status).json({
            ok: false,
            error: createData.message || 'Failed to create database'
          });
        }

        return res.json({
          ok: true,
          id: createData.id,
          name: databaseName,
          created: true
        });
      } catch (error) {
        console.error('Error finding/creating Notion database:', error);
        return res.status(500).json({ 
          ok: false, 
          error: error.message || 'Error processing request' 
        });
      }
    }

    // Default search behavior for backward compatibility
    const response = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers,
      body: JSON.stringify({
        filter: { property: "object", value: "database" },
        page_size: 100,
        ...body
      })
    });

    const text = await response.text();
    
    // If Notion returns non-JSON (rare), forward it
    try {
      const data = text ? JSON.parse(text) : {};
      return res.status(response.status).json(data);
    } catch (parseErr) {
      console.error("Notion returned non-JSON:", text);
      return res.status(response.status).type("text").send(text);
    }
  } catch (err) {
    console.error("Function exception:", err && (err.stack || err.message || err));
    return res.status(500).json({ ok:false, error: String(err && (err.message || err)) });
  }
}
