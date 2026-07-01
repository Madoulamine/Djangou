const { db, FieldValue, Timestamp } = require("../config/firebase");

const COLLECTIONS = Object.freeze({
  USERS: "users",
  COURSES: "courses",
  QUIZZES: "quizzes",
  EVALUATIONS: "evaluations",
  QUIZ_RESULTS: "quizResults",
  EVAL_RESULTS: "evalResults",
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications",
  BADGES: "badges",
  CERTIFICATIONS: "certifications",
  DEFIS: "defis",
  CONCOURS: "concours",
});

function collectionRef(collectionName) {
  if (!collectionName) {
    throw new Error("Le nom de la collection Firestore est obligatoire.");
  }

  return db.collection(collectionName);
}

function addTimestamps(data) {
  const now = FieldValue.serverTimestamp();

  return {
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

// Cree un document avec un id automatique ou un id impose.
async function createDocument(collectionName, data, documentId = null) {
  const payload = addTimestamps(data);

  if (documentId) {
    const ref = collectionRef(collectionName).doc(documentId);
    await ref.set(payload);

    return {
      id: ref.id,
      ...payload,
    };
  }

  const ref = await collectionRef(collectionName).add(payload);

  return {
    id: ref.id,
    ...payload,
  };
}

async function getDocumentById(collectionName, documentId) {
  const snapshot = await collectionRef(collectionName).doc(documentId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

async function updateDocument(collectionName, documentId, data) {
  const ref = collectionRef(collectionName).doc(documentId);
  const payload = {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.update(payload);

  return getDocumentById(collectionName, documentId);
}

async function deleteDocument(collectionName, documentId) {
  await collectionRef(collectionName).doc(documentId).delete();

  return true;
}

async function documentExists(collectionName, documentId) {
  const snapshot = await collectionRef(collectionName).doc(documentId).get();

  return snapshot.exists;
}

// Recupere une liste de documents avec filtres simples pour eviter la duplication.
async function listDocuments(collectionName, options = {}) {
  const { filters = [], orderBy = null, limit = 50 } = options;

  let query = collectionRef(collectionName);

  filters.forEach(([field, operator, value]) => {
    query = query.where(field, operator, value);
  });

  if (orderBy) {
    const [field, direction = "asc"] = orderBy;
    query = query.orderBy(field, direction);
  }

  const snapshot = await query.limit(limit).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function findOneByField(collectionName, field, value) {
  const snapshot = await collectionRef(collectionName)
    .where(field, "==", value)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];

  return {
    id: doc.id,
    ...doc.data(),
  };
}

module.exports = {
  COLLECTIONS,
  Timestamp,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  documentExists,
  listDocuments,
  findOneByField,
};
