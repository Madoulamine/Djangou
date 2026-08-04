// src/controllers/export.controller.js
// Gère l'export Excel et PDF des résultats globaux par matière et par enseignant.

const exceljs = require("exceljs");
const PDFDocument = require("pdfkit");
const { db } = require("../config/firebase");
const { COLLECTIONS } = require("../services/firebase.service");

/**
 * Récupère et structure les données de toutes les évaluations d'un professeur
 * pour une matière et un niveau donnés.
 */
async function fetchGlobalResults(teacherId, subject, level) {
    // 1. Récupérer les évaluations de cette matière/niveau créées par ce prof
    const evalsSnapshot = await db.collection(COLLECTIONS.EVALUATIONS)
        .where("teacherId", "==", teacherId)
        .where("subject", "==", subject)
        .where("level", "==", level.toUpperCase())
        .orderBy("createdAt", "asc")
        .get();

    if (evalsSnapshot.empty) {
        throw new Error("Aucune évaluation trouvée pour cette matière et ce niveau.");
    }

    const evaluations = [];
    const evaluationIds = [];

    evalsSnapshot.forEach(doc => {
        evaluations.push({ id: doc.id, title: doc.data().title });
        evaluationIds.push(doc.id);
    });

    // Optionnel : si le prof a plus de 30 évas, Firestore `in` plantera (max 30).
    // On va fetch par chunks de 30 si nécessaire.
    const allResults = [];
    for (let i = 0; i < evaluationIds.length; i += 30) {
        const chunk = evaluationIds.slice(i, i + 30);
        const resultsSnap = await db.collection(COLLECTIONS.EVAL_RESULTS)
            .where("evalId", "in", chunk)
            .get();

        resultsSnap.forEach(doc => allResults.push(doc.data()));
    }

    // 2. Grouper les résultats par élève
    const studentsMap = new Map();

    allResults.forEach(res => {
        if (!studentsMap.has(res.studentId)) {
            // Un utilisateur Djangou normal a nom/prénom stocké dans sa table user,
            // mais ici on s'appuie sur son email et on va récupérer son vrai nom depuis users
            studentsMap.set(res.studentId, {
                studentId: res.studentId,
                email: res.studentEmail,
                matiere: subject,
                niveau: level.toUpperCase(),
                notes: {}, // map evalId -> score (normalisé sur 20 ou selon barème)
                sumScore: 0,
                evalCount: 0
            });
        }

        const student = studentsMap.get(res.studentId);

        // Ramener la note sur 20 (standardisation) pour faire la moyenne
        let normalizedScore = res.score;
        if (res.maxScore !== 20) {
            normalizedScore = (res.score / res.maxScore) * 20;
        }

        student.notes[res.evalId] = normalizedScore;
        student.sumScore += normalizedScore;
        student.evalCount += 1;
    });

    // 3. Récupérer les noms complets depuis la collection users (s'ils ne sont pas dans eval_results)
    const finalData = [];
    for (const [studentId, data] of studentsMap.entries()) {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(studentId).get();
        if (userDoc.exists) {
            data.prenom = userDoc.data().prenom || "Inconnu";
            data.nom = userDoc.data().nom || "Inconnu";
        } else {
            data.prenom = data.email;
            data.nom = "";
        }
        data.moyenne = data.evalCount > 0 ? (data.sumScore / data.evalCount) : 0;
        finalData.push(data);
    }

    // 4. Classement (Tri par moyenne décroissante)
    finalData.sort((a, b) => b.moyenne - a.moyenne);

    // Assigner le rang
    finalData.forEach((student, index) => {
        student.rang = index + 1;
    });

    return { evaluations, students: finalData };
}

/**
 * EXPORT EXCEL : Génère le fichier XLSX pour le classement global d'une matière.
 * Route : GET /api/export/excel?subject=Mathematiques&level=PRIMAIRE
 */
async function exportToExcel(req, res, next) {
    try {
        const { subject, level } = req.query;
        if (!subject || !level) {
            const err = new Error("Paramètres 'subject' et 'level' requis."); err.statusCode = 400; throw err;
        }

        const { evaluations, students } = await fetchGlobalResults(req.user.id, subject, level);

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet(`Classement ${subject}`);

        // Définition des colonnes dynamiques
        const columns = [
            { header: "Rang", key: "rang", width: 8 },
            { header: "Prénom", key: "prenom", width: 25 },
            { header: "Nom", key: "nom", width: 20 },
            { header: "Matière", key: "matiere", width: 20 },
            { header: "Niveau", key: "niveau", width: 15 },
        ];

        evaluations.forEach((ev, idx) => {
            columns.push({ header: `Note Éva ${idx + 1} (/20)`, key: `eval_${ev.id}`, width: 18 });
        });

        columns.push({ header: "Moyenne Finale (/20)", key: "moyenne", width: 20 });
        worksheet.columns = columns;

        // Remplissage des données
        students.forEach(student => {
            const rowData = {
                rang: student.rang,
                prenom: student.prenom,
                nom: student.nom,
                matiere: student.matiere,
                niveau: student.niveau,
                moyenne: student.moyenne.toFixed(2)
            };

            // Ajouter les notes individuelles
            evaluations.forEach(ev => {
                rowData[`eval_${ev.id}`] = student.notes[ev.id] !== undefined ? student.notes[ev.id].toFixed(2) : "ABS";
            });

            worksheet.addRow(rowData);
        });

        // Esthétisme première ligne (Header)
        worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF34495E" } };
        worksheet.getRow(1).alignment = { horizontal: "center" };

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=Classement_${subject}_${level}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
}

/**
 * EXPORT PDF : Génère le fichier PDF pour le classement global d'une matière.
 * Route : GET /api/export/pdf?subject=Mathematiques&level=PRIMAIRE
 */
async function exportToPdf(req, res, next) {
    try {
        const { subject, level } = req.query;
        if (!subject || !level) {
            const err = new Error("Paramètres 'subject' et 'level' requis."); err.statusCode = 400; throw err;
        }

        const { evaluations, students } = await fetchGlobalResults(req.user.id, subject, level);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Classement_${subject}_${level}.pdf`);
        doc.pipe(res);

        // Header du PDF
        doc.fontSize(20).text(`Classement Général - ${subject}`, { align: "center", underline: true });
        doc.fontSize(12).text(`Niveau : ${level}`, { align: "center" });
        doc.text(`Enseignant ID : ${req.user.id}`, { align: "center" });
        doc.moveDown(2);

        // On crée un tableau basique en texte formaté vu que PDFKit natif n'a pas de module de tableau avancé
        // On affichera Rang, Nom complet, Moyenne
        const startX = 50;
        let yPointer = doc.y;

        // Ligne d'en-tête
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text("Rang", startX, yPointer, { width: 50 });
        doc.text("Prénom & Nom", startX + 70, yPointer, { width: 200 });
        doc.text(`Nombre d'évas`, startX + 300, yPointer, { width: 100 });
        doc.text("Moyenne (/20)", startX + 420, yPointer, { width: 100 });

        doc.moveTo(startX, yPointer + 15).lineTo(550, yPointer + 15).stroke();
        yPointer += 25;

        // Lignes du tableau
        doc.font('Helvetica');
        students.forEach(student => {
            if (yPointer > 750) {
                doc.addPage();
                yPointer = 50;
            }

            doc.text(`${student.rang}`, startX, yPointer, { width: 50 });
            doc.text(`${student.prenom} ${student.nom}`, startX + 70, yPointer, { width: 200 });
            doc.text(`${student.evalCount} / ${evaluations.length}`, startX + 300, yPointer, { width: 100 });

            // Format de la moyenne en gras si >= 10, sinon rouge (si pdfkit le gère facilement, restons basique)
            doc.text(`${student.moyenne.toFixed(2)}`, startX + 420, yPointer, { width: 100 });

            doc.moveTo(startX, yPointer + 15).lineTo(550, yPointer + 15).dash(2, { space: 2 }).stroke();
            doc.undash();
            yPointer += 20;
        });

        doc.moveDown(2);
        doc.fontSize(10).text(`Généré par Djangou Académie le ${new Date().toLocaleDateString()}`, { align: "center", font: "Helvetica-Oblique" });

        doc.end();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    exportToExcel,
    exportToPdf
};
