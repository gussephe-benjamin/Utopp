from main import app

@app.post("/uttop/register")
async def register():
    return 