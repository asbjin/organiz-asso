import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer les formulaires avec validation
 * @param {Object} initialValues - Valeurs initiales du formulaire
 * @param {Function} validate - Fonction de validation
 * @param {Function} onSubmit - Fonction à exécuter lors de la soumission
 */
const useForm = (initialValues, validate, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effectue la validation lorsque les valeurs ou le flag d'envoi changent
  useEffect(() => {
    if (isSubmitting) {
      const noErrors = Object.keys(errors).length === 0;
      if (noErrors) {
        onSubmit(values);
      }
      setIsSubmitting(false);
    }
  }, [errors, isSubmitting, onSubmit, values]);

  // Validation à la modification des valeurs (uniquement pour les champs touchés)
  useEffect(() => {
    const validationErrors = validate ? validate(values) : {};
    const touchedErrors = Object.keys(touched).reduce((acc, key) => {
      if (touched[key] && validationErrors[key]) {
        acc[key] = validationErrors[key];
      }
      return acc;
    }, {});
    setErrors(touchedErrors);
  }, [values, touched, validate]);

  // Gestion du changement de valeur
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  // Gestion de la perte de focus (pour marquer un champ comme "touché")
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true,
    });
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    // Marquer tous les champs comme touchés
    const touchedFields = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(touchedFields);
    // Valider et définir les erreurs
    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);
    setIsSubmitting(Object.keys(validationErrors).length === 0);
  };

  // Réinitialisation du formulaire
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
  };
};

export default useForm; 