const fs = require('fs');
const path = 'c:\\Users\\sidy\\Desktop\\School\\server\\src\\routes\\superadmin.js';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');

    const newLines = [
        ...lines.slice(0, 61),
        '',
        'router.patch(\'/schools/:id/details\', (req, res) => {',
        '    const { id } = req.params;',
        '    const { unique_code, name, admin_email } = req.body;',
        '    try {',
        '        db.prepare(\'BEGIN\').run();',
        '        const schoolUpdates = [];',
        '        const schoolParams = [];',
        '        if (unique_code !== undefined) { schoolUpdates.push(\'unique_code = ?\'); schoolParams.push(unique_code); }',
        '        if (name !== undefined) { schoolUpdates.push(\'name = ?\'); schoolParams.push(name); }',
        '        if (schoolUpdates.length > 0) {',
        '            schoolParams.push(id);',
        '            db.prepare(`UPDATE schools SET ${schoolUpdates.join(\', \')} WHERE id = ?`).run(...schoolParams);',
        '        }',
        '        if (admin_email !== undefined) {',
        '            db.prepare("UPDATE users SET email = ? WHERE school_id = ? AND role = \'admin\'").run(admin_email, id);',
        '        }',
        '        db.prepare(\'COMMIT\').run();',
        '        res.json({ message: \'Informations de l\\\'école mises à jour\' });',
        '    } catch (error) {',
        '        if (db.inTransaction) db.prepare(\'ROLLBACK\').run();',
        '        res.status(500).json({ error: error.message });',
        '    }',
        '});',
        '',
        'router.patch(\'/profile/email\', (req, res) => {',
        '    const { email } = req.body;',
        '    if (!email) return res.status(400).json({ error: \'L\\\'email est requis\' });',
        '    try {',
        '        const result = db.prepare(\'UPDATE users SET email = ? WHERE id = ? AND is_superadmin = 1\').run(email, req.user.id);',
        '        if (result.changes > 0) {',
        '            res.json({ message: \'Email du SuperAdmin mis à jour\' });',
        '        } else {',
        '            res.status(404).json({ error: \'Utilisateur non trouvé\' });',
        '        }',
        '    } catch (error) {',
        '        res.status(500).json({ error: error.message });',
        '    }',
        '});',
        ...lines.slice(61)
    ];

    fs.writeFileSync(path, newLines.join('\n'));
    console.log('Update complete');
} catch (err) {
    console.error(err);
}
