/**
 * Utilitaire de validation client-side
 */

// Validation de l'email
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "L'adresse email est requise";
  if (!regex.test(email)) return "Format d'adresse email invalide";
  return null;
};

// Validation du mot de passe
export const validatePassword = (password) => {
  if (!password) return "Le mot de passe est requis";
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
  if (!/[A-Z]/.test(password)) return "Le mot de passe doit contenir au moins une majuscule";
  if (!/[a-z]/.test(password)) return "Le mot de passe doit contenir au moins une minuscule";
  if (!/[0-9]/.test(password)) return "Le mot de passe doit contenir au moins un chiffre";
  return null;
};

// Validation du pseudo
export const validateUsername = (username) => {
  if (!username) return "Le pseudo est requis";
  if (username.length < 3) return "Le pseudo doit contenir au moins 3 caractères";
  if (username.length > 20) return "Le pseudo ne doit pas dépasser 20 caractères";
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return "Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores";
  return null;
};

// Validation du titre d'un message ou forum
export const validateTitle = (title) => {
  if (!title) return "Le titre est requis";
  if (title.length < 3) return "Le titre doit contenir au moins 3 caractères";
  if (title.length > 100) return "Le titre ne doit pas dépasser 100 caractères";
  return null;
};

// Validation du contenu d'un message
export const validateContent = (content) => {
  if (!content) return "Le contenu est requis";
  if (content.length < 3) return "Le contenu doit contenir au moins 3 caractères";
  if (content.length > 2000) return "Le contenu ne doit pas dépasser 2000 caractères";
  return null;
};

// Fonctions de validation de formulaires complets
export const validateLoginForm = (values) => {
  const errors = {};
  const emailError = validateEmail(values.email);
  const passwordError = validatePassword(values.password);

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return errors;
};

export const validateRegisterForm = (values) => {
  const errors = {};
  const emailError = validateEmail(values.email);
  const passwordError = validatePassword(values.password);
  const usernameError = validateUsername(values.username);

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (usernameError) errors.username = usernameError;
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Les mots de passe ne correspondent pas";
  }

  return errors;
}; 