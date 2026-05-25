package org.example.cad.util;

import java.util.UUID;

public class IdGenerator {
    
    public static String generateId() {
        return UUID.randomUUID().toString();
    }
    
    public static String generateShortId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
