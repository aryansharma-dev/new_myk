/* global process */ // Fixed: declare process so eslint recognizes environment check without pulling in Node types.

const createValidator = (typeName, predicate) => {
  const validator = (props, propName, componentName) => {
    const value = props[propName];
    if (value == null) {
      return null;
    }
    if (!predicate(value)) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.error(`Invalid prop \`${propName}\` supplied to \`${componentName}\`. Expected ${typeName}.`);
      }
    }
    return null;
  };
  validator.isRequired = (props, propName, componentName) => {
    const value = props[propName];
    if (value == null && typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error(`Prop \`${propName}\` is marked as required in \`${componentName}\`.`);
      return null;
    }
    return validator(props, propName, componentName);
  };
  return validator;
};

export const simplePropTypes = {
  func: createValidator('function', (value) => typeof value === 'function'),
  string: createValidator('string', (value) => typeof value === 'string'),
};

// Fixed: lightweight prop-type helpers replace missing dependency while satisfying lint.

