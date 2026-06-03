package org.example.cad.domain.geometry;

public class Circle implements Shape {

    private double radius;

    public Circle() {}

    public Circle(double radius) {
        this.radius = radius;
    }

    public double getRadius() {
        return radius;
    }

    public void setRadius(double radius) {
        this.radius = radius;
    }

    @Override
    public String toJson() {
        return "{ \"type\": \"circle\", \"radius\": " + radius + " }";
    }
}