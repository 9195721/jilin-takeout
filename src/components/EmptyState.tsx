import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLink?: string;
  actionText?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLink,
  actionText,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <i className={`${icon} text-gray-200 text-6xl mb-4`}></i>
      </motion.div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {actionLink && actionText && (
        <Link to={actionLink} className="text-blue-500 hover:text-blue-600 font-medium">
          {actionText} <i className="fas fa-arrow-right ml-1"></i>
        </Link>
      )}
    </motion.div>
  );
};

export default EmptyState;
