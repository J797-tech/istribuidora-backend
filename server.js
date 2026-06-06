const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- CONEXIÓN A MONGODB ---
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://herreralisandro422_db_user:tcc_over_app@distribuidora.zp7zcah.mongodb.net/distribuidora?retryWrites=true&w=majority&appName=distribuidora';

mongoose.connect(mongoURI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error MongoDB:', err));

// --- MODELO DE USUARIO ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// --- MODELO DE CLIENTE (ESQUEMA COMPLETO) ---
const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
    productType: { type: String, default: 'Garrafón' },
    expectedQuantity: { type: Number, default: 1 }
}, {
    timestamps: true,
    toJSON: { transform: (doc, ret) => { ret.id = ret._id; delete ret._id; return ret; } }
});
const Client = mongoose.model('Client', clientSchema);

// --- RUTAS DE AUTENTICACIÓN ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const nuevoUsuario = new User({ email, password: hashedPassword });
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado" });
    } catch (err) {
        res.status(400).json({ error: "Email ya registrado" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await User.findOne({ email });
        if (!usuario) return res.status(404).json({ error: "Usuario no existe" });

        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) return res.status(401).json({ error: "Clave incorrecta" });

        res.json({ message: "OK", userId: usuario._id });
    } catch (err) {
        res.status(500).json({ error: "Error de servidor" });
    }
});

// --- RUTAS DE CLIENTES ---
app.get('/api/clientes', async (req, res) => {
    try {
        const clientes = await Client.find().sort({ createdAt: -1 });
        res.json(clientes);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener clientes" });
    }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const nuevo = new Client(req.body);
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (err) {
        res.status(400).json({ error: "Error al guardar cliente" });
    }
});

// ACTUALIZAR CLIENTE
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const actualizado = await Client.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // Retorna el documento ya actualizado
        );
        if (!actualizado) return res.status(404).json({ error: "Cliente no encontrado" });
        res.json(actualizado);
    } catch (err) {
        res.status(400).json({ error: "Error al actualizar cliente" });
    }
});

// ELIMINAR CLIENTE
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const eliminado = await Client.findByIdAndDelete(req.params.id);
        if (!eliminado) return res.status(404).json({ error: "Cliente no encontrado" });
        res.json({ message: "Cliente eliminado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar cliente" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ SERVIDOR FUNCIONAL EN PUERTO ${PORT}`);
    console.log(`🚀 Listo para Login, Registro y Clientes\n`);
});
