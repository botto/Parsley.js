define('parsley/factory/constraint', [
  'parsley/utils'
], function (ParsleyUtils) {

  var converters = {
    string: function(string) {
      return string;
    },
    integer: function(string) {
      if (isNaN(string))
        throw 'Requirement is not an integer: "' + string + '"';
      return parseInt(string, 10);
    },
    number: function(string) {
      if (isNaN(string))
        throw 'Requirement is not a number: "' + string + '"';
      return parseFloat(string);
    },
    reference: function(string) {
      var result = $(string);
      if (result.length === 0)
        throw 'No such reference: "' + string + '"';
      return result;
    },
  };

  var convertArrayRequirement = function(string, length) {
    var m = string.match(/^\s*\[(.*)\]\s*]/)
    if (!m)
      throw 'Requirement is not an array: "' + string + '"';
    var values = m[1].split(',')
    if (values.length !== length)
      throw 'Requirement has ' + values.length + ' values when ' + length + ' are needed';
    return values;
  };

  var Constraint = function() {

  };

  Constraint.prototype = {
    validate: function(value) {
      var args = this.parseRequirements();
      args.unshift(value);
      if ($.isArray(value)) {
        if (!this.validateMultiple)
          throw 'Validator ' + this.name + ' does not handle multiple values';
        return this.validateMultiple.apply(this, args);
      } else {
        if (this.validateNumber) {
          if (isNaN(value))
            return false;
          args[0] = parseFloat(value)
          return this.validateNumber.apply(this, args);
        }
        if (this.validateString) {
          return this.validateString.apply(this, args);
        }
        throw 'Validator ' + this.name + ' only handles multiple values';
      }
    },

    parseRequirements: function() {
      if ('string' !== typeof this.requirements)
        return string; // Assume requirement already parsed
      if ($.isArray(this.requirementType)) {
        var values = convertArrayRequirement(this.requirements, this.requirementType.length);
        for (var i = 0; i < values.length; i++)
          values[i] = convertRequirement(this.requirementType[i], values[i]);
        return values;
      } else {
        converter = converters[this.requirementType || 'string'];
        if (!converter)
          throw 'Unknown requirement specification: "' + this.requirementType + '"';
        return converter(this.requirements);
      }
    },
  };

 };

  var ConstraintFactory = function (parsleyField, name, requirements, priority, isDomConstraint) {
    if (!new RegExp('ParsleyField').test(parsleyField.__class__))
      throw new Error('ParsleyField or ParsleyFieldMultiple instance expected');

    var validator = window.ParsleyValidator.validators[name];
    if ('function' === validator)
      validator = validator(requirements);

    return $.extend({}, validator, {
      name: name,
      requirements: requirements,
      priority: priority || parsleyField.options[name + 'Priority'] || 2,
      isDomConstraint: isDomConstraint
    });
  };

  return ConstraintFactory;
});
