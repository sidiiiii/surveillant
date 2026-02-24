const db = require('./src/database');

async function deleteSchool() {
    const code = 'SCH-9IRK29';
    try {
        // Find school ID
        const { rows: schools } = await db.query('SELECT id FROM schools WHERE unique_code = $1', [code]);
        if (schools.length === 0) {
            console.log(`Aucune école trouvée avec le code ${code}`);
            return;
        }

        const schoolId = schools[0].id;

        // Delete users linked to this school
        await db.query('DELETE FROM users WHERE school_id = $1', [schoolId]);
        console.log(`Utilisateurs de l'école ${code} supprimés.`);

        // Delete classes and students (just in case)
        await db.query('DELETE FROM students WHERE school_id = $1', [schoolId]);
        await db.query('DELETE FROM classes WHERE school_id = $1', [schoolId]);

        // Delete school
        await db.query('DELETE FROM schools WHERE id = $1', [schoolId]);
        console.log(`L'école ${code} a été supprimée avec succès.`);

    } catch (e) {
        console.error('Erreur lors de la suppression :', e);
    } finally {
        process.exit();
    }
}

deleteSchool();
