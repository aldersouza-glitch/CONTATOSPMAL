# Guia de Integração: Aplicativo + Supabase + Google Sheets

Para que a sincronização automática funcione entre os três, siga estes passos:

## 1. Configuração do Supabase

### Criar a Tabela
No seu painel do Supabase (SQL Editor), execute este comando:

```sql
create table officers (
  id text primary key,
  category text,
  unit text,
  rank text,
  matricula text,
  name text,
  role text,
  contact text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar Realtime para esta tabela
alter publication supabase_realtime add table officers;
```

### Obter Credenciais
Vá em **Project Settings > API** e copie a **Project URL** e a **anon key**.
Cole-as no arquivo `.env` do seu projeto local.

---

## 2. Integração com Google Sheets

Para que o Google Sheets atualize o Supabase (e vice-versa), usaremos o **Google Apps Script**.

### No Google Sheets:
1.  Abra sua planilha.
2.  Vá em **Extensões > Apps Script**.
3.  Cole o seguinte código (ajustando a URL e a KEY do seu Supabase):

```javascript
const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_KEY = 'SUA_KEY_ANON_AQUI';

function onEdit(e) {
  // Este gatilho rodará sempre que você mudar algo na planilha
  // Ele pode enviar o dado para o Supabase via API REST
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const row = range.getRow();
  
  if (row > 1) { // Ignora o cabeçalho
    const data = sheet.getRange(row, 1, 1, 8).getValues()[0];
    const officer = {
      id: data[0],
      category: data[1],
      unit: data[2],
      rank: data[3],
      matricula: data[4],
      name: data[5],
      role: data[6],
      contact: data[7]
    };
    
    updateSupabase(officer);
  }
}

function updateSupabase(officer) {
  const url = `${SUPABASE_URL}/rest/v1/officers?id=eq.${officer.id}`;
  const options = {
    method: 'patch',
    contentType: 'application/json',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    payload: JSON.stringify(officer)
  };
  
  UrlFetchApp.fetch(url, options);
}

function syncFromSupabase() {
  // Função para puxar tudo do Supabase para a Planilha
  const url = `${SUPABASE_URL}/rest/v1/officers?select=*`;
  const options = {
    method: 'get',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Limpa e repovoa
  sheet.clear();
  sheet.appendRow(['id', 'category', 'unit', 'rank', 'matricula', 'name', 'role', 'contact']);
  data.forEach(of => {
    sheet.appendRow([of.id, of.category, of.unit, of.rank, of.matricula, of.name, of.role, of.contact]);
  });
}
```

---

## 3. Sincronização Supabase -> Google Sheets

Para que mudanças no App/Supabase reflitam na planilha NA HORA:
1.  No Supabase, vá em **Database > Webhooks**.
2.  Crie um novo Webhook para a tabela `officers`.
3.  O destino deve ser uma **WebApp URL** do Google Apps Script (que você obtém clicando em "Implantar" no Apps Script).

---

Ao finalizar esses passos, qualquer alteração na **Planilha**, no **App** ou diretamente no **Supabase** será refletida instantaneamente nos outros dois!
