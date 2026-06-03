package org.example.cad.domain.model;

import org.example.cad.domain.enums.OperationType;

import java.time.Instant;

public class Operation {

    private OperationType type;
    private String targetId;
    private Instant timestamp;

    public Operation() {
    }

    public Operation(OperationType type, String targetId) {
        this.type = type;
        this.targetId = targetId;
        this.timestamp = Instant.now();
    }

    public OperationType getType() {
        return type;
    }

    public void setType(OperationType type) {
        this.type = type;
    }

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}