Ui.P1 = function () {};

Ui.P1.prototype = Object.create(Ui.prototype);

Ui.P1.prototype.createElement = function () {
  "use strict";
  Ui.prototype.createElement.apply(this, arguments);
  this.addComponent(
    new Ui.Pointer({
      type: "Rect",
      pointerWidth: 3,
      pointerHeight: this.width / 5,
      offset: this.width / 2 - this.width / 3.3 - this.width / 10,
    }),
  );

  // Use custom dialStep if provided, otherwise use regular step
  var dialSteps = this.options.dialsteps || this.options.steps;

  this.addComponent(
    new Ui.Scale(
      this.merge(this.options, {
        drawScale: false,
        drawDial: true,
        steps: dialSteps, // Override steps for dial display only
        radius: this.width / 2.6,
      }),
    ),
  );

  var circle = new Ui.El.Circle(
    this.width / 3.3,
    this.width / 2,
    this.height / 2,
  );
  this.el.node.appendChild(circle.node);
  this.el.node.setAttribute("class", "p1");
};
