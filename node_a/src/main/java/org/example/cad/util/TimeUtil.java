package org.example.cad.util;

import java.text.SimpleDateFormat;
import java.util.Date;

public class TimeUtil {
    
    private static final String DEFAULT_FORMAT = "yyyy-MM-dd HH:mm:ss";
    
    public static long getCurrentTimestamp() {
        return System.currentTimeMillis();
    }
    
    public static String format(long timestamp) {
        return format(timestamp, DEFAULT_FORMAT);
    }
    
    public static String format(long timestamp, String format) {
        SimpleDateFormat sdf = new SimpleDateFormat(format);
        return sdf.format(new Date(timestamp));
    }
}
