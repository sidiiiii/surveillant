const db = require('./src/database');

console.log('=== Migration: Ajout NNI et Niveaux Scolaires ===\n');

try {
    // 1. Ajouter les nouvelles colonnes
    console.log('Ajout des colonnes...');

    db.exec('ALTER TABLE students ADD COLUMN nni TEXT');
    console.log('✅ Colonne nni ajoutée');

    db.exec('ALTER TABLE students ADD COLUMN cycle TEXT');
    console.log('✅ Colonne cycle ajoutée');

    db.exec('ALTER TABLE students ADD COLUMN niveau TEXT');
    console.log('✅ Colonne niveau ajoutée');

    db.exec('ALTER TABLE students ADD COLUMN serie TEXT');
    console.log('✅ Colonne serie ajoutée');

    // 2. Créer index unique sur NNI
    console.log('\nCréation des index...');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_students_nni ON students(nni)');
    console.log('✅ Index unique sur NNI créé');

    // 3. Migration des données existantes (optionnel)
    console.log('\nMigration des données existantes...');
    const students = db.prepare('SELECT id FROM students WHERE nni IS NULL').all();

    const updateStmt = db.prepare('UPDATE students SET nni = ?, cycle = ?, niveau = ? WHERE id = ?');

    students.forEach((student, index) => {
        const nni = `NNI${String(1000 + index).padStart(10, '0')}`;
        const cycle = 'Primaire';
        const niveau = 'Classe 1';

        updateStmt.run(nni, cycle, niveau, student.id);
    });

    console.log(`✅ ${students.length} étudiants migrés avec NNI par défaut`);

    console.log('\n🎉 Migration terminée avec succès!');

} catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
}
